$(document).ready(function () {
  $.ajax({
    dataType: "json",
    url: "/uploaded/files/json/installationCost.json",
    success: function (data, status) {
      if (data) {
        for (var key in data) {
          $(key).text(data[key]);
        }
      } else {        
        console.log("Статус ответа файла с ценами:" + status);
      }
    }
  })
});