console.log('Extension is running...')

chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name == 'teachers')
  port.onMessage.addListener(function (msg) {
    teacherName = msg.message
    postGrade(
      port,
      teacherName,
      'feri',
      'uni',
      msg.teacherListIndex,
      msg.teacherIndex
    )
  })
})

async function postGrade (
  port,
  teacher,
  faculty,
  programme,
  teacherListIndex,
  teacherIndex
) {
  //Namesto whitespaca bo alineja
  var formattedTeacher = teacher.replace(/ /g, '-')
  //Velike črke v imenu v male
  formattedTeacher = formattedTeacher.toLowerCase()
  //Tukaj zamenjujem šumnike na nešumnike
  //Zastavica g, da zamenjamo vse instance
  formattedTeacher = formattedTeacher.replace(/č/g, 'c')
  formattedTeacher = formattedTeacher.replace(/š/g, 's')
  formattedTeacher = formattedTeacher.replace(/ć/g, 'c')
  formattedTeacher = formattedTeacher.replace(/ž/g, 'z')

  /**
   * TUKAJ PIŠEMO IZJEME
   */
  switch (formattedTeacher) {
    case 'tatjana-petek':
      formattedTeacher = 'petek-1'
      break
    case 'ivan-kovacic':
      formattedTeacher = 'ivan-kovacic-tehnicni'
      break
  }

  //Pošljemo link
  var currentLink =
    'http://profesorji.net/profesor/' +
    faculty +
    '/' +
    programme +
    '/' +
    formattedTeacher
  //Pošljemo oceno
  var currentGrade = await makeRequest(currentLink)
  console.log(currentGrade)
  //Zamenjamo ime in priimek in poskusimo še enkrat
  if (currentGrade == 'Ni ocene') {
    //V linku je ime profesorja v sedmem delu stringa, splitanega z '/'
    var name = currentLink.split('/')[6]
    //zamenjavamo ime in priimek profesorja, da dobimo več rezultatov
    name = name
      .trim()
      .split('-')
      .slice(0, 2)
      .reverse()
      .join('-')
    //v linku namesto trenutnega imena vstavimo zamenjano ime
    currentLink =
      currentLink.substring(0, currentLink.length - name.length) + name
    currentGrade = await makeRequest(currentLink)

    //Če je še vedno 'Ni ocene', vnesemo samo priimek
    if (currentGrade == 'Ni ocene') {
      //V linku je ime in priimek profesorja v sedmem delu stringa, splitanega z '/'
      var surname = currentLink.split('/')[6]
      //Ven dobimo samo priimek, tukaj sta prvo priimek nato ime - npr. ojstersek-milan -> ojstersek
      surname = surname.split('-')[0]
      //V linku namesto trenutnega imena vstavimo samo priimek
      currentLink =
        currentLink.substring(0, currentLink.length - name.length) + surname
      currentGrade = await makeRequest(currentLink)
      if (currentGrade == 'Ni ocene') {
        currentLink =
          'http://profesorji.net/faculties/' +
          faculty +
          '/programmes/' +
          programme +
          '/lectureships/new'
      }
      //Če na koncu še vedno nima ocene, bo link preusmeril na ustvarjanje novega profesorja
    }
  }
  port.postMessage({
    grade: currentGrade,
    link: currentLink,
    teacherListIndex: teacherListIndex,
    teacherIndex: teacherIndex
  })
}

//swappedNames je, da preprečimo infinite recursion - torej samo enkrat zamenjamo ime in priimek profesorja, ko ga ne najdemo
async function makeRequest (link) {
  return new Promise(function (resolve) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', link, true)
    xhr.onreadystatechange = function () {
      status = xhr.status
      if (xhr.readyState == 4 && status == 200) {
        //uporabimo DOMParser, da convertamo HTML string v DOM element
        var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html')
        //class elementa je 'profesor', ta ima nestan 'span' element, njegov innHTML pa je ocena
        var currentGrade = doc.getElementsByClassName('profesor')[0].children[0]
          .innerHTML
        resolve(currentGrade)
      } else if (xhr.readyState == 4) {
        resolve('Ni ocene')
      }
    }
    xhr.send()
  })
}
