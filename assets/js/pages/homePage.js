import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory, Link } from 'react-router';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import moment from 'moment';

import 'react-datepicker/dist/react-datepicker.css';


class Home extends React.Component {
  render() {
    return (
      <div>
        <h2>Welcome to the Social ToDo List</h2>
        <p>This is a Django + React SPA (Single Page Application) that allows you to create lists and add tasks to them.</p>
        <p>Tasks can be marked as done and can have a deadline associated to it. But remember: you can only see tasks
        that you've created!</p>
        <h3>Enjoy!</h3>
      </div>
    );
  }
}

class ShowLists extends React.Component {
  constructor() {
    super();

    this.submitCreateList = this.submitCreateList.bind(this);
    this.deleteList = this.deleteList.bind(this);

    this.state = {
      username: "",
      lists: [],
      error: "",
    };
  }

  componentDidMount() {
    self = this;
    axios.get('/get_all_lists/')
      .then(function (response) {
        if (response.data && response.data.length > 0) {
          self.setState({lists: JSON.parse(response.data)});
        } else {
          self.setState({error: "No lists were found."});
        }
      })
    .catch(function (error) {
      console.log("ERROR:", error);
      self.setState({error: "There was an error during the request. Please check the data and try again."});
    });
  }

  submitCreateList() {
    self = this;
    var axios_instance = axios.create({
      headers: {"X-CSRFToken": localStorage.getItem("csrftoken")}
    });

    axios_instance.post('/create_list/',
      {
        data: {
            userId: "1",
            newListName: this.newListNameInput.value,
        }
      }
    ).then(function (response) {
        var message = response.data.message;
        if (message.search("success") != -1) {
            var tempLists = self.state.lists;
            tempLists.push(JSON.parse(response.data.newList)[0]);
            self.setState({lists: tempLists});

            // reset field after successfully creating a new list
            self.newListNameInput.value = "";
        }
      })
    .catch(function (error) {
      console.log("ERROR:", error);
      self.setState({error: "There was an error during the request. Please check the data and try again."});
    });
  };

  deleteList(e) {
    var list_id = $(e.currentTarget).attr('data-id');
    self = this;
    var axios_instance = axios.create({
      headers: {"X-CSRFToken": localStorage.getItem("csrftoken")}
    });

    axios_instance.post('/delete_list/' + list_id + '/',
      {
        data: {
            userId: "1"  // TODO: send user ID/secret/whatever in all requests
        }
      }
    ).then(function (response) {
        var message = response.data.message;
        if (message.search("success") != -1) {
            var tempLists = self.state.lists;
            for (var i = 0; i < self.state.lists.length; i++) {
                if (self.state.lists[i].pk == list_id) {
                    tempLists.splice(i, 1);
                }
            }
            self.setState({lists: tempLists});
        }
      })
    .catch(function (error) {
      console.log("ERROR:", error);
      self.setState({error: "There was an error during the request. Please check the data and try again."});
    });
  };

  render() {
    var list_items = [];
    if (this.state.lists) {
        for (var i = 0; i < this.state.lists.length; i++) {
          var list_id = this.state.lists[i].pk;
          var path = "/edit_list/" + list_id + "/";
          list_items.push(
            <li key={i}>
              <Link to={path}>{this.state.lists[i].fields.name}</Link>&nbsp;
              <input type="button" data-id={list_id} value="delete" onClick={this.deleteList} />&nbsp;
            </li>
          );
        }
    }

    return (
      <div>
        <h2>Lists Index:</h2>
        <br />
        {
          !this.state.lists ?
          <p style={{ color: "red", fontWeight: "bold" }}><i>No lists created yet.</i></p> :
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

        <h4>Create new List</h4>
        <input type="text" name="newListName" ref={(input) => { this.newListNameInput = input; }} />
        <input type="button" value="Create List" style={{ margin: "5px"}} onClick={this.submitCreateList} />
      </div>
    );
  }
}

class EditList extends React.Component {
  constructor(props) {
    super(props);

    this.submitNewItem = this.submitNewItem.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.toggleDone = this.toggleDone.bind(this);

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

    axios_instance.post('/edit_list/' + this.props.params.list_id + '/toggle_done/' + item_id + '/',
      {
        data: {
            userId: "1"  // TODO: send user ID/secret/whatever in all requests
        }
      }
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

  generateListItemsForRendering() {
    var list_items = [];
    if (this.state.items) {
        for (var i = 0; i < this.state.items.length; i++) {

          var item = this.state.items[i];
          var style = item.fields.done ? {"textDecoration": "line-through"} : {"textDecoration": "inherit"};
          var deadline = item.fields.deadline ? " (due on " + item.fields.deadline + ")" : "";
          var done_text = item.fields.done ? "not done" : "done";
          var path = "/edit_list/" + this.state.list[0].pk + "/edit_item/" + item.pk + "/";

          list_items.push(
            <li key={i}>
                <Link to={path}><a style={style}>{item.fields.text}</a>{deadline}</Link>&nbsp;
                <input type="button" data-id={item.pk} value="delete" onClick={this.deleteItem} />&nbsp;
                <input type="button" data-id={item.pk} value={"mark as " + done_text} onClick={this.toggleDone} />&nbsp;
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

class EditItem extends React.Component {
  constructor(props) {
    super(props);

    this.submitEditItem = this.submitEditItem.bind(this);
    this.handleItemChanged = this.handleItemChanged.bind(this);

    this.state = {
      list: null,
      item: null,
      newItemText: "",
      newItemDeadline: null,
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
        <h4><Link to={return_path}>Back to {list_name}</Link></h4>
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

class App extends React.Component {
  render() {
    return (
      <div>
        <h1>Social ToDo List</h1>
        <ul className="header">
          <li><Link activeClassName="active" to="/">Home</Link></li>
          <li><Link activeClassName="active" to="/all/">See and Create Lists</Link></li>
          <li><Link activeClassName="active" to="/logout/">Logout</Link></li>
        </ul>
        <div className="content">
          {this.props.children}
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Home} />
      <Route path="all" component={ShowLists} />
      <Route path="edit_list/:list_id" component={EditList} />
      <Route path="edit_list/:list_id/edit_item/:item_id" component={EditItem} />
    </Route>
  </Router>,
  document.getElementById('react-app')
);

//
//ReactDOM.render(
//  <div>
//    <App/>
//  </div>,
//  document.getElementById('react-app')
//);
