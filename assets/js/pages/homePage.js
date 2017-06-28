import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory, Link } from 'react-router';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import moment from 'moment';

import 'react-datepicker/dist/react-datepicker.css';


/***
  TODO: Refactor "Filter" components in order to have a single one that receives parameters and returns a component
  for each type of filter, instead of having 4 almost identical blocks of code.
  Requires a bit more React knowledge.
***/


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


class AddHandle extends React.Component {
  render() {
    return (
      <div>
        <p>Write a Twitter handle below to fetch its tweets.</p>
        <form method="POST" action="/tweets/process_add_handle/">
          <input type="hidden" name="csrfmiddlewaretoken" value={ localStorage.getItem("csrftoken") } />
          <input type="hidden" name="user_id" value="1" />
          <input type="text" name="handleName" />
          <input type="submit" value="Fetch Tweets!" style={{ margin: "5px"}} />
        </form>
      </div>
    );
  }
}

function FilterResults(props) {
  return (
    <div>
      <h3>Tweets Filtered:</h3>
      <select name="filteredTweets" style={{ minWidth: "20%", maxWidth: "95%" }} size="10">
        {
          props.results.data ?
          props.results.data.map(function(result) {
            return <option key={result.provider_id} value={result.provider_id} style={{ padding: "6px" }}>
              @{result.owner} said: {result.text}
            </option>;
          }) :
          console.log()
        }
      </select>
    </div>
  );
}


class FilterByUser extends React.Component {
  constructor() {
    super();

    this.state = {
      username: "",
      results: [],
      error: "",
    };
  }

  fetchData() {
    var username = this.state.username.trim();
    var results = [];
    self = this;
    if (username != "" && username.length > 0) {
      axios.get('/tweets/filters/user/' + username + '/')
        .then(function (response) {
          if (response.data && response.data.length > 0) {
            self.setState({results: response});
          } else {
            self.setState({error: "No tweets were found with this filtering criteria."});
          }
        })
        .catch(function (error) {
          console.log(error);
          self.setState({error: "There was an error during the request. Please check the data and try again."});
      });
    }
  }

  storeResults(results) {
    this.setState({ results: results });
  }

  storeUsername(evt) {
    this.setState({ username: evt.target.value });
  }

  render() {
    return (
      <div>
        <p>Filter by Username - Type the username below:</p>
        <br />
        <a style={{ fontWeight: "bold" }}>Username:</a> <input type="text" onBlur={(evt) => this.storeUsername(evt)} />
        <input type="button" onClick={() => this.fetchData()} value="FILTER!" style={{ margin: "5px" }}/>
        <br />
        {
          this.state.error ?
          <p style={{ color: "red", fontWeight: "bold" }}>{ this.state.error }</p> :
          <a></a>
        }
        <br />
        <FilterResults results={this.state.results}/>
      </div>
    );
  }
}

class FilterByDate extends React.Component {
  constructor() {
    super();

    this.state = {
      date: moment(),
      results: [],
      error: "",
    };

    this.handleDateChange = this.handleDateChange.bind(this);
  }

  fetchData() {
    var date = this.state.date.format().trim();
    var results = [];
    self = this;
    if (date != "" && date.length > 0) {
      axios.get('/tweets/filters/date/' + date + '/')
        .then(function (response) {
          if (response.data && response.data.length > 0) {
            self.setState({results: response});
          } else {
            self.setState({error: "No tweets were found with this filtering criteria."});
          }
        })
        .catch(function (error) {
          console.log(error);
          self.setState({error: "There was an error during the request. Please check the data and try again."});
      });
    }
  }

  storeResults(results) {
    this.setState({ results: results });
  }

  storeDate(evt) {
    this.setState({ date: evt.target.value });
  }

  handleDateChange(date) {
    this.setState({ date: date });
  }

  render() {
    return (
      <div>
        <p>Filter by Date - Pick the date below:</p>
        <br />
        <a style={{ fontWeight: "bold", marginRight: "5px" }}>Date:</a>
        <DatePicker selected={this.state.date} onChange={this.handleDateChange} />
        <input type="button" onClick={() => this.fetchData()} value="FILTER!" style={{ margin: "5px" }}/>
        <br />
        {
          this.state.error ?
          <p style={{ color: "red", fontWeight: "bold" }}>{ this.state.error }</p> :
          <a></a>
        }
        <br />
        <FilterResults results={this.state.results}/>
      </div>
    );
  }
}

class FilterByText extends React.Component {
  constructor() {
    super();

    this.state = {
      text: "",
      results: [],
      error: "",
    };
  }

  fetchData() {
    var text = this.state.text.trim();
    var results = [];
    self = this;
    if (text != "" && text.length > 0) {
      axios.get('/tweets/filters/text/' + text + '/')
        .then(function (response) {
          if (response.data && response.data.length > 0) {
            self.setState({results: response});
          } else {
            self.setState({error: "No tweets were found with this filtering criteria."});
          }
        })
        .catch(function (error) {
          console.log(error);
          self.setState({error: "There was an error during the request. Please check the data and try again."});
      });
    }
  }

  storeResults(results) {
    this.setState({ results: results });
  }

  storeText(evt) {
    this.setState({ text: evt.target.value });
  }

  render() {
    return (
      <div>
        <p>Filter by Text - Type the text below:</p>
        <br />
        <a style={{ fontWeight: "bold" }}>Text:</a> <input type="text" onBlur={(evt) => this.storeText(evt)} />
        <input type="button" onClick={() => this.fetchData()} value="FILTER!" style={{ margin: "5px" }}/>
        <br />
        {
          this.state.error ?
          <p style={{ color: "red", fontWeight: "bold" }}>{ this.state.error }</p> :
          <a></a>
        }
        <br />
        <FilterResults results={this.state.results}/>
      </div>
    );
  }
}

class FilterByHashtag extends React.Component {
  constructor() {
    super();

    this.state = {
      hashtagList: [],
      hashtag: "",
      results: [],
      error: "",
    };
  }

  fetchData() {
    var hashtag = this.state.hashtag.trim();
    var results = [];
    self = this;
    if (hashtag != "" && hashtag.length > 0 && hashtag != "---") {
      hashtag = hashtag.replace("#", "");
      axios.get('/tweets/filters/hashtag/' + hashtag + '/')
        .then(function (response) {
          if (response.data && response.data.length > 0) {
            self.setState({results: response});
          } else {
            self.setState({error: "No tweets were found with this filtering criteria."});
          }
        })
        .catch(function (error) {
          console.log(error);
          self.setState({error: "There was an error during the request. Please check the data and try again."});
      });
    }
  }

  storeResults(results) {
    this.setState({ results: results });
  }

  storeHashtag(evt) {
    this.setState({ hashtag: evt.target.value });
  }

  componentDidMount() {
    self = this;
    axios.get('/tweets/list_hashtags/')
      .then(function (response) {
        if (response.data && response.data.length > 0) {
          self.setState({hashtagList: response})
        } else {
          self.setState({error: "No hashtags were found, please add more tweets to the database."});
        }
      })
      .catch(function (error) {
        console.log(error);
        self.setState({error: "There was an error during the request. Please reload the page."});
    });
  }

  render() {
    return (
      <div>
        <p>Filter by Hashtag - Pick the hashtag below:</p>
        <br />
        <a style={{ fontWeight: "bold", marginRight: "5px" }}>Hashtag:</a>

        <select onChange={(evt) => this.storeHashtag(evt)}>
          <option value="">---</option>
          {
            this.state.hashtagList.data ?
            this.state.hashtagList.data.map(function(hashtag, i) {
              return <option key={i}
                value={hashtag.name}>{hashtag.name}</option>;
            }) :
            console.log()
          }
        </select>

        <input type="button" onClick={() => this.fetchData()} value="FILTER!" style={{ margin: "5px" }}/>
        <br />
        {
          this.state.error ?
          <p style={{ color: "red", fontWeight: "bold" }}>{ this.state.error }</p> :
          <a></a>
        }
        <br />
        <FilterResults results={this.state.results}/>
      </div>
    );
  }
}


class App extends React.Component {
  render() {
    return (
      <div>
        <h1>VinTwitta</h1>
        <ul className="header">
          <li><Link activeClassName="active" to="/tweets">Home</Link></li>
          <li><Link activeClassName="active" to="/tweets/add_handle">Add Twitter Handle</Link></li>
          <li><Link activeClassName="active" to="/tweets/filters_user">Filter by Username</Link></li>
          <li><Link activeClassName="active" to="/tweets/filters_date">Filter by Date</Link></li>
          <li><Link activeClassName="active" to="/tweets/filters_text">Filter by Text</Link></li>
          <li><Link activeClassName="active" to="/tweets/filters_hashtag">Filter by Hashtag</Link></li>
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
    <Route path="/" component={App}></Route>
    <Route path="/all" component={App}>
      <IndexRoute component={Home} />
      <Route path="add_handle" component={AddHandle} />
      <Route path="filters_user" component={FilterByUser} />
      <Route path="filters_date" component={FilterByDate} />
      <Route path="filters_text" component={FilterByText} />
      <Route path="filters_hashtag" component={FilterByHashtag} />
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
