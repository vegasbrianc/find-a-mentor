import React, { Component } from 'react';
import { updateMentor, deleteMentor, createApplication } from '../../api';
import model from './model';
import Select from 'react-select';
import './EditProfile.css';
import { isMentor, fromMtoVM, fromVMtoM } from '../../helpers/user';

export default class EditProfile extends Component {
  state = {
    user: fromMtoVM(this.props.user),
  };

  onSubmit = async e => {
    const { user } = this.state;
    e.preventDefault();
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
            <label>
              <span>{fieldName}</span>
              <CustomTag
                value={user[fieldName] || config.defaultValue}
                type="text"
                name={fieldName}
                onChange={e =>
                  this.handleInputChange(e.target.name, e.target.value)
                }
              />
            </label>
          </div>
        );
      case 'tags':
      case 'select':
        return (
          <div className="form-field">
            <label>
              <span>{fieldName}</span>
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
                options={config.options}
              />
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

  render() {
    const { disabled } = this.state;
    const { user } = this.props;
    return (
      <>
        <button onClick={this.onDelete}>Delete account</button>
        <form onSubmit={this.onSubmit} className="edit-profile">
          <div className="form-fields">
            {Object.entries(model).map(([fieldName, field]) => this.formField(fieldName, field))}
          </div>
          <div className="form-submit">
            <button disabled={disabled}>
              {user.roles.includes('MENTOR') ? 'Save' : 'Become a Mentor'}
            </button>
            {disabled && <i className="fa fa-spin fa-spinner" />}
          </div>
        </form>
      </>
    );
  }
}