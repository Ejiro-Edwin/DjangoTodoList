import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory, Link } from 'react-router';
import axios from 'axios';

import ShowLists from './showLists';
import EditList from './editList';
import EditItem from './editItem';


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

class App extends React.Component {
  render() {
    return (
      <div>
        <h1>Social ToDo List</h1>
        <ul className="header">
          <li><Link activeClassName="active" to="/">Home</Link></li>
          <li><Link activeClassName="active" to="/all/">See and Create Lists</Link></li>
//          <li><Link activeClassName="active" to="/disconnect/twitter/">Logout</Link></li>
          <li><a href="/disconnect/twitter/">Logout</a></li>
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
