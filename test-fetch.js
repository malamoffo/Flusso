fetch("https://www.santa-pazienza.it/feed").then(r => r.text()).then(t => console.log(t.substring(0, 100)));
