const hyttpo = require('hyttpo');
async function bypass(link) {
   return Promise.resolve()
    .then(() =>  hyttpo.get(`https://vacant-curtly-composure.herokuapp.com/bypass2?url=${link}`))
    .then((res) => {
      return res.data.destination
    })

}

module.exports = bypass