import React from 'react';
import axios from 'axios';
import { Link } from 'react-router';



class EditList extends React.Component {
  constructor(props) {
    super(props);

    this.submitNewItem = this.submitNewItem.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.toggleDone = this.toggleDone.bind(this);
    this.postToTwitter = this.postToTwitter.bind(this);

    this.state = {
      username: "",
      list: null,
      items: [],
      error: "",
      message: "",
    };
  }

  componentDidMount() {
    self = this;
    axios.get('/get_list_info/' + this.props.params.list_id + '/')
      .then(function (response) {
        if (response.data.items && response.data.list) {
          self.setState({list: JSON.parse(response.data.list), items: JSON.parse(response.data.items)});
        } else {
          self.setState({error: "No lists were found."});
        }
      })
    .catch(function (error) {
      console.log("ERROR:", error);
      self.setState({error: "There was an error during the request. Please check the data and try again."});
    });
  }

  submitNewItem () {
    self = this;
    self.state.message = "";
    var axios_instance = axios.create({
      headers: {"X-CSRFToken": localStorage.getItem("csrftoken")}
    });

    axios_instance.post('/edit_list/' + this.props.params.list_id + '/add_item/',
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
            var tempItems = self.state.items;
            tempItems.push(JSON.parse(response.data.newItem)[0]);
            self.setState({items: tempItems});

            // reset fields after successfully adding a new item
            self.newItemTextInput.value = "";
            self.newItemDoneInput.checked = false;
            self.newItemDeadlineInput.value = null;
        }
      })
    .catch(function (error) {
      console.log("ERROR:", error);
      self.setState({error: "There was an error during the request. Please check the data and try again."});
    });
  };

  deleteItem(e) {
    var item_id = $(e.currentTarget).attr('data-id');
    self = this;
    self.state.message = "";
    var axios_instance = axios.create({
      headers: {"X-CSRFToken": localStorage.getItem("csrftoken")}
    });

    axios_instance.post('/edit_list/' + this.props.params.list_id + '/delete_item/' + item_id + '/',
      {
        data: {
            userId: "1"  // TODO: send user ID/secret/whatever in all requests
        }
      }
    ).then(function (response) {
        self.setState({message: response.data.message});
        if (self.state.message.search("success") != -1) {
            var tempItems = self.state.items;
            for (var i = 0; i < self.state.items.length; i++) {
                if (self.state.items[i].pk == item_id) {
                    tempItems.splice(i, 1);
                }
            }
            self.setState({items: tempItems});
        }
      })
    .catch(function (error) {
      console.log("ERROR:", error);
      self.setState({error: "There was an error during the request. Please check the data and try again."});
    });
  };

  toggleDone(e) {
    var item_id = $(e.currentTarget).attr('data-id');
    self = this;
    self.state.message = "";
    var axios_instance = axios.create({
      headers: {"X-CSRFToken": localStorage.getItem("csrftoken")}
    });

    axios_instance.post('/edit_list/' + this.props.params.list_id + '/toggle_done/' + item_id + '/', {}
    ).then(function (response) {
        self.setState({message: response.data.message});
        if (self.state.message.search("success") != -1) {
            var updatedItem = JSON.parse(response.data.updatedItem)[0];
            var tempItems = self.state.items;
            for (var i = 0; i < tempItems.length; i++) {
                if (tempItems[i].pk == updatedItem.pk) {
                    tempItems[i] = updatedItem;
                    break;
                }
            }
            self.setState({items: tempItems});
        }
      })
    .catch(function (error) {
      console.log("ERROR:", error);
      self.setState({error: "There was an error during the request. Please check the data and try again."});
    });
  };

  postToTwitter(e) {
    var item_id = $(e.currentTarget).attr('data-id');
    self = this;
    self.state.message = "";
    var axios_instance = axios.create({
      headers: {"X-CSRFToken": localStorage.getItem("csrftoken")}
    });

    axios_instance.post('/post_to_twitter/',
      {
        data: {
            itemId: item_id,
            listId: self.props.params.list_id
        }
      }
    ).then(function (response) {
        self.setState({message: response.data.message});
      })
    .catch(function (error) {
      console.log("ERROR:", error);
      self.setState({error: "There was an error during the request. Please check the data and try again."});
    });
  };

  generateListItemsForRendering() {
    var list_items = [];
    if (this.state.items) {
        for (var i = 0; i < this.state.items.length; i++) {

          var item = this.state.items[i];
          var style = item.fields.done ? {"textDecoration": "line-through"} : {"textDecoration": "inherit"};

          var deadline = ""
          if (item.fields.deadline) {
            var pattern = /\d{4}-\d{2}-\d{2}/
            deadline = pattern.exec(item.fields.deadline)
          }

          deadline = deadline ? " (due on " + deadline + ")" : "";
          var done_text = item.fields.done ? "not done" : "done";
          var path = "/lists/edit_list/" + this.state.list[0].pk + "/edit_item/" + item.pk + "/";

          list_items.push(
            <li key={i}>
                <Link to={path}><a style={style}>{item.fields.text}</a>{deadline}</Link>&nbsp;
                <input type="button" data-id={item.pk} value="delete" onClick={this.deleteItem} />&nbsp;
                <input type="button" data-id={item.pk} value={"mark as " + done_text} onClick={this.toggleDone} />&nbsp;
                <input type="button" data-id={item.pk} value={"post to Twitter"} onClick={this.postToTwitter} />&nbsp;
            </li>);
        }
    }
    return list_items;
  };

  render() {
    var list_items = this.generateListItemsForRendering();

    var list_name = this.state.list ? this.state.list[0].fields.name : "";

    return (
      <div>
        <h2>Details for list {list_name}</h2>
        <br />
        {
          !this.state.items ?
          <p style={{ color: "red", fontWeight: "bold" }}><i>No items in this list yet.</i></p> :
          <a></a>
        }
        {
          this.state.error ?
          <p style={{ color: "red", fontWeight: "bold" }}><i>There was an error, please try again.</i></p> :
          <a></a>
        }

        <ul>
          {list_items}
        </ul>

        <h4>Add new Item to List</h4>
        Text: <input type="text" name="newItemText" ref={(input) => { this.newItemTextInput = input; }} /> <br/>
        Deadline: <input type="date" name="newItemDeadline" ref={(input) => { this.newItemDeadlineInput = input }} /> <br/>
        Done: <input type="checkbox" name="newItemDone" ref={(input) => { this.newItemDoneInput = input }} /> <br/>
        <input type="button" value="Add Item" style={{ margin: "5px"}} onClick={this.submitNewItem} />

        <div>
          <br />
          <p>{this.state.message}</p>
        </div>
      </div>
    );
  }
}

export default EditList;