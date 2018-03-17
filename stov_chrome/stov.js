const API_URL = `https://api.stackexchange.com/2.2/search?site=stackoverflow`;
const QUESTIONS_SOURCE = `https://stackoverflow.com/questions`;
const SEARCH_URL = `https://stackoverflow.com/search`;
const SQ_BRKTS = /\[(.*?)\]/g;
const INS_SQ_BRKTS = /[^[\]]+(?=])/g;

//Fired when the user focuses the address bar and types the extension's omnibox keyword, followed by a space.
chrome.omnibox.onInputStarted.addListener(setBasicSuggestion);

//Fired whenever the user's input changes, after they have focused the address bar and typed the extension's omnibox keyword, followed by a space.
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  var timeout = null;
  clearTimeout(timeout);
  timeout = setTimeout(function() {
    let headers = new Headers({"Accept": "application/json"});
    let init = {
      method: 'GET',
      headers
    };
    let url = buildSearchURL(text);
    let request = new Request(url, init);

    fetch(request).then(buildSuggestionsFromResponse).then(suggest);
  }, 250);
});

//Fired when the user accepts one of the extension's suggestions.
chrome.omnibox.onInputEntered.addListener((text) => {
  let url = text;
  if (text) {
    //If the user selects the default suggestion, show all results
    if (!text.startsWith(QUESTIONS_SOURCE)) {
      url = `${SEARCH_URL}?q=${encodeURIComponent(text.trim()).replace(' ', '+')}`;
    }
  } else {
    url = `https://github.com/natedehorn/stov`;
  }
  chrome.tabs.update({url});
});

function buildSearchURL(input) {
  var tags = input.match(INS_SQ_BRKTS)
    ? input.match(INS_SQ_BRKTS).join(';')
    : '';
  var intitles = input.replace(SQ_BRKTS, '').trim().replace(' ', ';');
  return `${API_URL}&sort=votes&tagged=${tags}&intitle=${intitles}`;
}

function setBasicSuggestion() {
  chrome.omnibox.setDefaultSuggestion({description: `Search StackOverflow`});
}

function buildSuggestionsFromResponse(response) {
  return new Promise(resolve => {
    let suggestions = [];
    let suggestionsOnEmptyResults = [
      {
        description: "no results found",
        content: QUESTIONS_SOURCE
      }
    ];
    response.json().then(json => {
      if (json.items) {
        json.items.forEach(({title, link}) => {
          var elem = document.createElement('textarea');
          elem.innerHTML = title;
          suggestions.push({description: `${elem.value}`, content: link});
        });
      }
      return suggestions
        ? resolve(suggestions)
        : resolve(suggestionsOnEmptyResults);
    });
  });
}
