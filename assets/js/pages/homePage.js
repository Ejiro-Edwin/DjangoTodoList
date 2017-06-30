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

  render() {
    var list_items = [];
    if (this.state.lists) {
        for (var i = 0; i < this.state.lists.length; i++) {
          var path = "/edit_list/" + this.state.lists[i].pk + "/";
          list_items.push(<li key={i}><Link to={path}>{this.state.lists[i].fields.name}</Link></li>);
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

        <p>Create new List</p>
        <form method="POST" action="/create_list/">
          <input type="hidden" name="csrfmiddlewaretoken" value={ localStorage.getItem("csrftoken") } />
          <input type="hidden" name="user_id" value="1" />
          <input type="text" name="newListName" />
          <input type="submit" value="Create List" style={{ margin: "5px"}} />
        </form>
      </div>
    );
  }
}


class EditList extends React.Component {
  constructor(props) {
    super(props);

    this.submitNewItem = this.submitNewItem.bind(this);

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
            console.log(":::: response.data.newItem:", JSON.parse(response.data.newItem)[0]);

            var temp_items = self.state.items;
            temp_items.push(JSON.parse(response.data.newItem)[0]);
            self.setState({items: temp_items});
        }
      })
    .catch(function (error) {
      console.log("ERROR:", error);
      self.setState({error: "There was an error during the request. Please check the data and try again."});
    });
  };

  render() {
    var list_items = [];
    if (this.state.items) {
        for (var i = 0; i < this.state.items.length; i++) {

          var item = this.state.items[i];
          var style = item.done ? {"textDecoration": "line-through"} : {"textDecoration": "inherit"};
          var deadline = item.done ? " (due on " + item.deadline + ")" : "";

          var delete_path = "/get_list_info/" + this.state.list.pk + "/delete_item/" + item.pk + "/";
          var done_path = "/get_list_info/" + this.state.list.pk + "/toggle_done/" + item.pk + "/";
          var done_text = item.done ? "not done" : "done";
          var edit_path = "/get_list_info/" + this.state.list.pk + "/edit_item/" + item.pk + "/";

          list_items.push(
            <li key={i}>
                <a style={style}>{item.fields.text}</a>{deadline}
                <a href={delete_path}>[delete]</a>
                <a href={done_path}>[mark as {done_text}]</a>
                <a href={edit_path}>[edit]</a>
            </li>);
        }
    }

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

        <p>Add new Item to List</p>
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
