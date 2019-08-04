import React, { Component } from 'react';
import classNames from 'classnames';
import { updateMentor, deleteMentor, createApplication } from '../../api';
import model from './model';
import Select from 'react-select';
import './EditProfile.css';
import { isMentor, fromMtoVM, fromVMtoM } from '../../helpers/user';
import { providers } from '../../channelProvider';

export default class EditProfile extends Component {
  state = {
    user: fromMtoVM(this.props.user),
    errors: [],
  };

  validate() {
    const errors = [];
    const { user } = this.state;
    Object.entries(model).forEach(([field, config]) => {
      if (config.options) {
        config.options.forEach(option => {
          if (option.validate && !option.validate(user[field][option.value])) {
            errors.push(`${config.label}:${option.label}`);
          }
        });
      }
      if (config.validate && !config.validate(user[field])) {
        errors.push(config.label);
      }
    });
    this.setState({
      errors,
    });
    return !errors.length;
  }

  onSubmit = async e => {
    const { user } = this.state;
    e.preventDefault();
    if (!this.validate()) {
      return;
    }
    this.setState({ disabled: true });
    const updateMentorResult = await updateMentor(fromVMtoM(user));
    if (updateMentorResult && !isMentor(user)) {
      const createApplicationResult = await createApplication();
      if (!createApplicationResult.success) {
        alert(createApplicationResult.message);
      }
    } else {
      alert('something went wrong, please open a bug');
    }
    this.setState({ disabled: false });
  };

  onDelete = () => {
    if (window.confirm('Are you sure you want to delete your account?')) {
      deleteMentor(this.state.user);
    }
  };

  formField = (fieldName, config) => {
    const { user } = this.state;
    switch (config.type) {
      case 'text':
      case 'longtext':
        const CustomTag = config.type === 'text' ? 'input' : 'textarea';

        return (
          <div key={fieldName} className="form-field" style={config.style}>
            <label
              id={fieldName}
              className={classNames({ required: !!config.validate })}
            >
              <div className="form-field-name">
                {config.label}
                {config.helpText && (
                  <span className="help-text">{config.helpText}</span>
                )}
              </div>
              <div className="form-field-input-wrapper">
                {config.previewImage && <img className="form-field-preview" src={user[fieldName]} alt="avatar" />}
                <CustomTag
                  aria-labelledby={fieldName}
                  value={user[fieldName] || config.defaultValue}
                  type="text"
                  name={fieldName}
                  required={config.required}
                  onChange={e =>
                    this.handleInputChange(e.target.name, e.target.value)
                  }
                />
              </div>
            </label>
          </div>
        );
      case 'tags':
      case 'select':
        return (
          <div key={fieldName} className="form-field" style={config.style}>
            <label
              id={fieldName}
              className={classNames({ required: !!config.validate })}
            >
              <div className="form-field-name">
                {config.label}
                {config.helpText && (
                  <span className="help-text">{config.helpText}</span>
                )}
              </div>
              <Select
                name={fieldName}
                className="input-extended"
                classNamePrefix="select"
                isMulti={config.type === 'tags'}
                isSearchable={true}
                value={user[fieldName] || config.defaultValue}
                onChange={(selected, data) =>
                  this.handleInputChange(data.name, selected)
                }
                options={
                  config.maxItems &&
                  (this.state.user[fieldName] || []).length === config.maxItems
                    ? [
                        {
                          label: 'Reached max items',
                          value: undefined,
                          isDisabled: true,
                        },
                      ]
                    : config.options
                }
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: base => ({ ...base, zIndex: 1000 }),
                }}
              />
            </label>
          </div>
        );
      case 'keyvalue':
        const filledChannels = config.options.filter(
          x => user[fieldName][x.value]
        ).length;
        return (
          <div key={fieldName} className="form-field" style={config.style}>
            <label
              id={fieldName}
              className={classNames({ required: !!config.validate })}
            >
              <div className="form-field-name">
                {config.label}
                {config.helpText && (
                  <span className="help-text">{config.helpText}</span>
                )}
              </div>
              <div className="form-fields">
                {config.options.map((option, indx) => {
                  const inputIcon =
                    providers[option.value].inputIcon ||
                    providers[option.value].icon;
                  const isDisabled =
                    filledChannels >= 3 && !user[fieldName][option.value];
                  return (
                    <div
                      className={`form-field channel-${option.value}`}
                      key={indx}
                    >
                      <div
                        className={classNames([
                          'channel-group',
                          { disabled: isDisabled },
                        ])}
                      >
                        <i className={`fa fa-${inputIcon}`}></i>
                        <label id={option.value}>{option.prefix}</label>
                        <input
                          aria-labelledby={option.value}
                          value={user[fieldName][option.value] || ''}
                          type="text"
                          name={`${fieldName}[${option.value}]`}
                          disabled={isDisabled}
                          placeholder={option.placeholder}
                          onChange={e =>
                            this.handleKeyValueChange(
                              fieldName,
                              option.value,
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </label>
          </div>
        );
      default:
        return <></>;
    }
  };

  handleInputChange = (fieldName, value) => {
    this.setState({
      user: {
        ...this.state.user,
        [fieldName]: value,
      },
    });
  };

  handleKeyValueChange = (fieldName, prop, value) => {
    this.setState({
      user: {
        ...this.state.user,
        [fieldName]: {
          ...this.state.user[fieldName],
          [prop]: value,
        },
      },
    });
  };

  render() {
    const { disabled, errors } = this.state;
    const { user } = this.props;
    return (
      <>
        <form onSubmit={this.onSubmit} className="edit-profile">
          <div className="form-fields">
            {Object.entries(model).map(([fieldName, field]) =>
              this.formField(fieldName, field)
            )}
          </div>
          <div className="form-submit">
            {!!errors.length && (
              <div className="form-errors">
                The following fields is missing or invalid: {errors.join(', ')}
              </div>
            )}
            <button className="submit" disabled={disabled}>
              {user.roles.includes('MENTOR') ? 'Save' : 'Become a Mentor'}
            </button>
            <button type="button" className="delete" onClick={this.onDelete}>
              Delete account
            </button>
            {disabled && <i className="fa fa-spin fa-spinner" />}
          </div>
        </form>
      </>
    );
  }
}
