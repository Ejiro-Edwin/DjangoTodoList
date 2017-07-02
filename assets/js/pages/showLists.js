import React from 'react';
import axios from 'axios';
import { Link } from 'react-router';

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

export default ShowLists;