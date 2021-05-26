import React from 'react'

// GET https://accounts.spotify.com/authorize?client_id=5fe01282e44241328a84e7c5cc169165&response_type=code&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&scope=user-read-private%20user-read-email&state=34fFs29kd09

const ENDPOINT="https://accounts.spotify.com/authorize"
const CLIENT_ID="e977e96f794b415183dfb07fe4f80cbc"

// redirect url after login
const REDIRECT = "http://localhost:5001/mood-panda/us-central1/spotify)."

//string instead of array because only 1
const SCOPES="user-read-recently-played"

const getToken = (hash) => {
    const params = hash.substring(1).split("&").reduce((accumulator, currentValue) => {
        const [key,value] = currentValue.split("=");
        accumulator[key]=value;
        return accumulator;

    }, {} ); //end of reduce method
    return params
};

//when click: should redirect to spotify
//when click agree: should redirect back to our page
const Webapp = () => {
    useEffect(() => {
        if (window.location.hash){
            const token = getToken(window.location.hash);
        }
    }
    const login = () => {
        window.location = `${ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT}&scope=${SCOPES}&response_type=token&show_dialogue=true`
    }
    return(
        <div class="container">
        <button onClick={login}>
            Go to Spotify
        </button>
        </div>
    );
};
