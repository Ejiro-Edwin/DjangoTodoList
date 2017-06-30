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

  deleteList(list_id) {
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
              <input type="button" value="delete" onClick={() => this.deleteList(list_id)} />&nbsp;
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
    };
  }

  componentDidMount() {
    self = this;
    axios.get('/get_list_info/' + this.props.params.list_id + '/')
      .then(function (response) {
        if (response.data.items && response.data.list) {
          self.setState({list: JSON.parse(response.data.list), items: JSON.parse(response.data.items)});
          console.log(":::: this.state.items:", self.state.items);
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
        var message = response.data.message;
        if (message.search("success") != -1) {
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

  deleteItem(item_id) {
    self = this;
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
        var message = response.data.message;
        if (message.search("success") != -1) {
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

  toggleDone(item_id) {
    console.log(":::: item_id:", item_id);
    self = this;
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
        var message = response.data.message;
        if (message.search("success") != -1) {
            var updatedItem = JSON.parse(response.data.updatedItem)[0];
            console.log(":::: updatedItem:", updatedItem);
            var tempItems = self.state.items;
            for (var i = 0; i < tempItems.length; i++) {
                if (tempItems[i].pk == updatedItem.pk) {
                    console.log(":::: i:", i);
                    console.log(":::: tempItems[i]:", tempItems[i]);
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

          list_items.push(
            <li key={i}>
                <a style={style}>{item.fields.text}</a>{deadline}&nbsp;
                <input type="button" value="delete" onClick={() => this.deleteItem(item.pk)} />&nbsp;
                <input type="button" value={"mark as " + done_text} onClick={() => this.toggleDone(item.pk)} />&nbsp;
                <input type="button" value="edit" />&nbsp;
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
          <p ></p>
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
