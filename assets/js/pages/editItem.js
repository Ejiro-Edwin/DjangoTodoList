import React from 'react';
import axios from 'axios';
import { Link } from 'react-router';


class EditItem extends React.Component {
  constructor(props) {
    super(props);

    this.submitEditItem = this.submitEditItem.bind(this);
    this.handleItemChanged = this.handleItemChanged.bind(this);

    this.state = {
      list: null,
      item: null,
      newItemText: "",
      newItemDeadline: "",
      newItemDone: false,
      error: "",
      message: "",
    };
  }

  componentDidMount() {
    self = this;
    axios.get('/get_item_info/' + this.props.params.item_id + '/')
      .then(function (response) {
        if (response.data.item) {
          self.setState({item: JSON.parse(response.data.item)[0]});
          self.setState({newItemText: self.state.item.fields.text});
          // datetime comes from django in the format YYYY-mm-ddTHH:MM:SS.ffffff
          var pattern = /\d{4}-\d{2}-\d{2}/
          var deadline = pattern.exec(self.state.item.fields.deadline)[0];
          self.setState({newItemDeadline: deadline});
          self.setState({newItemDone: self.state.item.fields.done});
          self.setState({list: JSON.parse(response.data.list)[0]});
        } else {
          self.setState({error: "Item not found."});
        }
      })
    .catch(function (error) {
      console.log("ERROR:", error);
      self.setState({error: "There was an error during the request. Please check the data and try again."});
    });
  }

  submitEditItem() {
    self = this;
    self.state.message = "";
    var axios_instance = axios.create({
      headers: {"X-CSRFToken": localStorage.getItem("csrftoken")}
    });

    axios_instance.post('/edit_list/' + this.props.params.list_id + '/edit_item/' + this.state.item.pk + '/edit/',
      {
        data: {
            newItemText: this.newItemTextInput.value,
            newItemDone: this.newItemDoneInput.checked,
            newItemDeadline: this.newItemDeadlineInput.value
        }
      }
    ).then(function (response) {
        self.setState({message: response.data.message});
        if (self.state.message.search("success") != -1) {
          self.setState({item: JSON.parse(response.data.item)[0]});
          self.setState({newItemText: self.state.item.fields.text});
          // datetime comes from django in the format YYYY-mm-ddTHH:MM:SS.ffffff
          var pattern = /\d{4}-\d{2}-\d{2}/
          var deadline = pattern.exec(self.state.item.fields.deadline)[0];
          self.setState({newItemDeadline: deadline});
          self.setState({newItemDone: self.state.item.fields.done});
          self.setState({list: JSON.parse(response.data.list)[0]});
        }
      })
    .catch(function (error) {
      console.log("ERROR:", error);
      self.setState({error: "There was an error during the request. Please check the data and try again."});
    });
  };

  handleItemChanged(e) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  render() {
     var list_name = this.state.list ? this.state.list.fields.name : "";
    if (this.state.list) {
      var return_path = "/edit_list/" + this.state.list.pk + "/";
    } else {
      var return_path = "/all/";
    }

    var itemText = this.state.item ? this.state.item.fields.text : "";
    var itemDeadline = "";
    if (this.state.item && this.state.item.fields.deadline) {
        var pattern = /\d{4}-\d{2}-\d{2}/
        itemDeadline = pattern.exec(this.state.item.fields.deadline)
    }
    var itemDone = false;
    if (this.state.item) { itemDone = this.state.item.fields.done ? true : false; }

    return (
      <div>
        <h4><Link to={return_path}>&lt;&lt; Back to {list_name}</Link></h4>
        <h2>Item Details - Edit Item</h2>
        <br />
        { !this.state.item ? <p style={{ color: "red", fontWeight: "bold" }}><i>Item information not found.</i></p> : <a></a> }
        { this.state.error ? <p style={{ color: "red", fontWeight: "bold" }}><i>There was an error, please try again.</i></p> : <a></a> }

        Text: <input type="text" name="newItemText" value={this.state.newItemText} onChange={this.handleItemChanged} ref={(input) => { this.newItemTextInput = input; }} /> <br/>
        Deadline: <input type="date" name="newItemDeadline" value={this.state.newItemDeadline} onChange={this.handleItemChanged} ref={(input) => { this.newItemDeadlineInput = input }} /> <br/>
        Done: <input type="checkbox" name="newItemDone" checked={this.state.newItemDone} onChange={this.handleItemChanged} ref={(input) => { this.newItemDoneInput = input }} /> <br/>
        <input type="button" value="Edit Item" style={{ margin: "5px"}} onClick={this.submitEditItem} />

        <div>
          <br />
          <p>{this.state.message}</p>
        </div>
      </div>
    );
  }
}

export default EditItem;