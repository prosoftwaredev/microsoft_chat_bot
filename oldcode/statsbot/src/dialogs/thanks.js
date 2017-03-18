const array = [
    "You're welcome!",
    "No Problem",
    "Anytime!",
    "Glad I could help :)"
]


module.exports = function (session){
    session.send("%s", array[Math.floor(Math.random() * array.length)])
}