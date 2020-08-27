var teachersList = document.getElementsByClassName('teachers')
var port = chrome.runtime.connect({ name: 'teachers' })

for (var i = 0; i < teachersList.length ; i++) {
  var teachers = teachersList[i]
  for (var j = 0; j < teachers.children.length; j++) {
      //teacher.children je oblike <li>Izvajatelj: <a ...>Ime izvajatelja</a></li> -> pridobimo innerHTML od značke a
      var teacherName = teachers.children[j].children[0].innerHTML
      port.postMessage({ message: teacherName, teacherListIndex: i, teacherIndex: j})
  }
}

port.onMessage.addListener(function (msg) {
  var newSpan = document.createElement('a')
  newSpan.href = msg.link
  newSpan.innerHTML = ' ' + msg.grade
  //Vstavimo oceno, glede na 
  teachersList[msg.teacherListIndex].children[msg.teacherIndex].children[0].appendChild(newSpan)
})
