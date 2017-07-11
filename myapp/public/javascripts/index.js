// Additional JS functions here

window.fbAsyncInit = function() {
    FB.init({
        appId: '1956274574651357', // App ID
        channelUrl: '//192.168.1.127/test/channel.html', // Channel File
        status: true, // check login status
        cookie: true, // enable cookies to allow the server to access the session
        xfbml: true, // parse XFBML
        version: 'v2.8'
    });

    FB.getLoginStatus(function(response) {
        toggleLoginButton(response)
    });
};

function login() {
    FB.login(function(response) {
        toggleLoginButton(response);
        if (response.authResponse) {
            var accessToken = response.authResponse.accessToken;
            console.log(accessToken);
            testAPI(accessToken);
        } else {
            // cancelled
        }
    }, {
        scope: 'user_likes'
    });
}

function getPredictions(likes, id, name) {
    var data = {
        likes: JSON.stringify(likes),
        userId: id,
        name: name
    };

    $.ajax({
        url: '/getPredictions',
        data: JSON.stringify(data),
        contentType: 'application/json',
        type: 'POST',
        dataType: 'json',
        success: function(data) {
            interpretations(_.sortBy(data.interpretations));
            predictions(_.sortBy(data.predictions, ["trait"]), _.sortBy(data.contributors, ["trait"]));
        },
        error: function(response) {
            console.log("Error while fetching predictions: " + response.responseText);
        }
    });
}

function getFacebookLikes(id, accessToken, name) {
    $.ajax({
        url: 'https://graph.facebook.com/v2.8/' + id + '/likes?limit=200&access_token=' + accessToken,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            var result = response.data.map(function(a) {
                return a.id;
            });
            getPredictions(result, id, name);

            $('#main-container').show();
            $('#start-btn').show();

        },
        error: function(response) {
            console.log("Error fetching facebook likes: " + response.responseText);
        }
    });
}

function toggleLoginButton(response) {
    if (response.status === 'connected') {
        $('#login').hide();
        $('#logout').show();
    } else {
        $('#logout').hide();
        $('#login').show();
    }
}

function testAPI(accessToken) {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
        var fbookId = response.id;
        var name = response.name;
        console.log('Good to see you, ' + name + '.');
        getFacebookLikes(fbookId, accessToken, name);
    });
}

var probabilities = ["Religion_Lutheran", "Relationship_Yes", "Concentration_Engineering", "Religion_Jewish", "Gay", "Politics_Liberal", "Concentration_Psychology", "Concentration_Law", "Concentration_IT", "Lesbian", "Religion_Catholic", "Concentration_Nursing", "Concentration_Journalism", "Female", "Politics_Conservative", "Concentration_Biology", "Concentration_Art", "Politics_Libertanian", "Relationship_None", "Concentration_Finance", "Religion_Mormon", "Relationship_Married", "Religion_None", "Religion_Christian_Other", "Concentration_Education", "Concentration_History", "Concentration_Business", "Politics_Uninvolved"];

    var percentiles = ["BIG5_Extraversion", "BIG5_Agreeableness", "BIG5_Neuroticism", "BIG5_Conscientiousness", "BIG5_Openness", "Satisfaction_Life", "Intelligence"];

    function round3(v) {
        return Math.round(v * 1000) / 1000;
    }

    function percentileOrProbability(trait) {
        if (probabilities.indexOf(trait) != -1) {
            return "Prob";
        } else if (percentiles.indexOf(trait) != -1) {
            return "Perc";
        } else {
            return "Num";
        }
    }

    function interpretations(_interpretations) {
        for (var i = 0; i < _interpretations.length; i++) {
            var row = _interpretations[i];
            var trait = row.trait;
            var value = row.value;
            if (!isNaN(value)) {
                value = round3(value);
            }
            var div = '<tr class="remove-el"><td>' + trait + '<span class="perc"> (Perc)</span></td><td>' + value + '</td></tr>';
            $("#interpretations").append(div);
        }
    }

    function predictions(_predictions, _contributors) {
        for (var i = 0; i < _predictions.length; i++) {
            // console.log(_predictions[i].trait, _contributors[i].trait);

            var row = _predictions[i];
            var trait = row.trait;
            var value = row.value;
            if (!isNaN(value)) {
                value = round3(value);
            }

            var pos = "";
            var neg = "";
            _.forEach(_contributors[i].positive, function(id) {
                pos += '<a class="remove-el" target="_blank" href="http://facebook.com/' + id + '">' + id + '</a>  ';
            });
            _.forEach(_contributors[i].negative, function(id) {
                neg += '<a class="remove-el" target="_blank" href="http://facebook.com/' + id + '">' + id + '</a>  ';
            })

            var type = percentileOrProbability(trait);

            var div = '<tr class="remove-el"><td>' + trait + '<span class="' + type.toLowerCase() + '"> (' + type + ')</span></td><td>' + value + '</td><td class="">' + neg + '</td><td class="">' + pos + '</td></tr>';
            $("#predictions").append(div);
        }
    }


(function(d) {
    var js, id = 'facebook-jssdk',
        ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement('script');
    js.id = id;
    js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    ref.parentNode.insertBefore(js, ref);
}(document));

$(document).ready(function() {
    $('#logout').click(function() {
        FB.logout();
        $('#logout').hide();
        $('#login').show();
        $('#analysis-table').hide();
        $('#affdex_elements').hide();
        $('#main-container').hide();
        $('.remove-el').remove();
    });

    $('#login').click(function() {
        login();
    });
});
