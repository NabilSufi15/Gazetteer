$(document).ready(function () {

    //Object containing data for location
    const locationData = {
        code: '',
        city: '',
        country: '',
        lat: '',
        lan: '',
        iso: '',
        ydsadadas: ''
    };

    //coronavirus data object
    const Data = {
        date: [],
        caseData: [],
        deathData: [],
        recoverData: []
    }

    //global variables
    var geoJSON;
    var pieChart = null;
    var lineChart = null;
    var ctx = document.getElementById("pieChart").getContext("2d");
    var ctx3 = document.getElementById("lineChart").getContext("2d");
    var xhr;
    var inter;
    var countryList = [];
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var issIcon = L.icon({
        iconUrl: 'images/ISS.png',
        iconSize: [50, 50],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76]
    });
    const issMarker = L.marker([0, 0], { icon: issIcon });

    bounds = new L.LatLngBounds(new L.LatLng(89.99346179538875, 180), new L.LatLng(-89.98155760646617, -180));

    //creates map and prevents user from dragging out of bounds
    var mymap = L.map('mapid', {
        minZoom: 3,
        zoom: 2,
        zoomControl: false
    })
        .setView([51.505, -0.09], 3)
        .setMaxBounds(bounds)
        .on('drag', function () {
            mymap.panInsideBounds(bounds, { animate: false });
        });

    //adds to map
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoidHJ5aW5naGFyZCIsImEiOiJja2czdndwbncwNGY5MzBuajFhaTc1YmVkIn0.2HbGWg7kKCd8OepErvrDUg'
    }).addTo(mymap);

    mymap.locate({ setView: true, maxZoom: 16 });

    //gets current location of user
    const onLocationFound = (e) => {
        var radius = e.accuracy;

        L.marker(e.latlng).addTo(mymap)
            .bindPopup("You are here").openPopup();

        L.circle(e.latlng, radius).addTo(mymap);

        onMapClick(e);
    }

    mymap.on('locationfound', onLocationFound);


    //displays data when country selected
    const onMapClick = (e) => {
        $.ajax({
            url: "php/Location.php",
            type: 'GET',
            dataType: 'json',
            data: {
                LAT: e.latlng.lat.toString(),
                LNG: e.latlng.lng.toString()
            },
            success: function (result) {

                if (result.status.name == "ok") {

                    // console.log(result);

                    locationData.code = result['data'][0].components.country_code;
                    locationData.country = result['data'][0].components.country;
                    locationData.continent = result['data'][0].components.continent;
                    locationData.lat = result['data'][0].geometry.lat;
                    locationData.lan = result['data'][0].geometry.lng;
                    locationData.iso = result['data'][0].components['ISO_3166-1_alpha-2'];

                    //displays the selected country using the country code
                    displayCountryBorder(locationData.iso);
                    displayCountryInfo(locationData.code);
                    displaySummary(locationData.country);
                    coronavirusTracker(locationData.code);
                    displayCurrentWeather(locationData.lat, locationData.lan);
                    weatherForecasts(locationData.lat, locationData.lan);
                    displayCurrentTime(locationData.lat, locationData.lan);
                    latestNews(locationData.code);
                    Gallery(locationData.country);

                }

            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                console.log(jqXHR, textStatus, errorThrown);
                console.log("location not working")
            }
        });
    }

    mymap.on('click', onMapClick);

    //Gets location selected 
    $('#selectCountry').on('change', function (e) {

        $.ajax({
            url: "php/LocationCode.php",
            type: 'GET',
            dataType: 'json',
            data: {
                CODE: this.value,
            },
            success: function (result) {

                if (result.status.name == "ok") {

                    // console.log(result);

                    locationData.code = result['data'][0].components.country_code;
                    locationData.country = result['data'][0].components.country;
                    locationData.continent = result['data'][0].components.continent;
                    locationData.lat = result['data'][0].geometry.lat;
                    locationData.lan = result['data'][0].geometry.lng;
                    locationData.iso = result['data'][0].components['ISO_3166-1_alpha-2'];

                    //displays the selected country using the country code
                    displayCountryBorder(locationData.iso);
                    displayCountryInfo(locationData.code);
                    displaySummary(locationData.country);
                    coronavirusTracker(locationData.code);
                    displayCurrentWeather(locationData.lat, locationData.lan);
                    weatherForecasts(locationData.lat, locationData.lan);
                    displayCurrentTime(locationData.lat, locationData.lan);
                    latestNews(locationData.code);
                    Gallery(locationData.country);

                }

            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                // console.log(jqXHR, textStatus, errorThrown);
                // console.log("location not working");
            }
        });
    })

    //retrieves the country names from json file and puts them into a select form
    $.getJSON("json/countryBorders.geo.json", function (data) {
        $.each(data.features, function (key, value) {
            countryList.push([value.properties.iso_a2, value.properties.name]);
        });

        //sorts into alphabetical order
        countryList.sort((a, b) => a[1].toUpperCase().localeCompare(b[1].toUpperCase()));

        for (let i = 0; i < countryList.length; i++) {
            $('#selectCountry').append($('<option></option>').attr('value', countryList[i][0]).text(countryList[i][1]));
        }
    });

    // displays selected country border 
    const displayCountryBorder = (countryCode) => {
        removeBorders();

        $.ajax({
            url: "php/CountryBorders.php",
            type: 'GET',
            dataType: 'json',
            data: {
                CODE: countryCode
            },
            success: function (result) {

                //console.log(result);
                geoJSON = L.geoJson(result, {
                    fillColor: '#BDC3C7',
                    weight: 2,
                    opacity: 1,
                    color: 'gray',
                    dashArray: '3',
                    fillOpacity: 0.7
                });
                geoJSON.addTo(mymap);

                //zooms into selcted country
                mymap.flyToBounds(geoJSON.getBounds(), {
                    padding: [50, 50],
                    maxZoom: 18,
                    animate: true,
                    duration: 5
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                // console.log(errorThrown);
                // console.log("border not working");
            }
        });
    }

    //displays country info
    const displayCountryInfo = (countryCode) => {
        $.ajax({
            url: "php/RestCountries.php",
            type: 'GET',
            dataType: 'json',
            data: {
                CODE: countryCode
            },
            success: function (result) {

                //console.log(result);

                $('#flag').attr('src', result['data'].flag);
                $('#name').text(result['data'].name);
                $('#capital').text(result['data'].capital);
                $('#native').text(result['data'].nativeName);
                $('#continent').text(result['data'].region);
                $('#population').text(thousandSeparator(result['data'].population));
                $('#area').text(`${thousandSeparator(result['data'].area)} km²`);
                $('#currency').text(`${result['data'].currencies[0].name} (${result['data'].currencies[0].symbol})`);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                // console.log(errorThrown);
                // console.log("rest not working");
            }
        });
    }

    //displays description of the country
    const displaySummary = (country) => {

        var text = country.split(" ").join("");
        if (text === "UnitedStatesofAmerica") {
            text = "UnitedStates";
        }

        $.ajax({
            url: "php/Wikipedia.php",
            type: 'GET',
            dataType: 'json',
            data: {
                COUNTRY: text
            },
            success: function (result) {

                // console.log(result);

                if (result['data'].length === 0) {
                    $('#summary').text('Summary not available.');
                    $('#wiki').addClass('disabled');
                } else {
                    $('#summary').text(result['data'][0].summary);
                    $('#wiki').attr('href', `https://${result['data'][0].wikipediaUrl}`);
                    $('#wiki').removeClass('disabled');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                // console.log(errorThrown);
                // console.log("summary not working");
            }
        });
    }

    //displays current weather
    const displayCurrentWeather = (lat, lan) => {
        $.ajax({
            url: "php/Weather.php",
            type: 'GET',
            dataType: 'json',
            data: {
                LAT: lat,
                LAN: lan
            },
            success: function (result) {

                // console.log(result);

                var temp = (result['data'].main.temp - 32) * 5 / 9;

                $('#city').text(result['data'].name);
                $('#icon').attr('src', `https://openweathermap.org/img/wn/${result['data']['weather'][0].icon}@4x.png`);
                $('#temperature').text(`${Math.ceil(temp)}°`); //"°C"
                $('#description').text(`${result['data']['weather'][0].description}`);
                $('#humidity').text(`${result['data'].main.humidity}%`);
                $('#speed').text(`${result['data'].wind.speed} m/h`);
                $('#cloud').text(`${result['data'].clouds.all}%`);
                $('#pressure').text(`${result['data'].main.pressure} hPa`);

            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                // console.log(errorThrown);
                // console.log("weather not working");
            }
        });
    }

    const weatherForecasts = (lat, lan) => {
        $.ajax({
            url: "php/WeatherForecast.php",
            type: 'GET',
            dataType: 'json',
            data: {
                LAT: lat,
                LAN: lan
            },
            success: function (result) {

                // console.log(result);

                $('#weather-forecast').empty();

                for (let i = 1; i < result['data'].daily.length; i++) {

                    var temp = (result['data'].daily[i].temp.max - 32) * 5 / 9;
                    var date = new Date(result['data'].daily[i].dt * 1000);
                    var day = date.getDay();

                    $("#weather-forecast").append('<tr>' +
                        '<td class="font-weight-normal align-middle">' + days[day] + '</td>' +
                        '<td class="float-right font-weight-normal">' +
                        '<p class="mb-1">' + Math.ceil(temp) + '&deg;</p>' +
                        '</td>' +
                        '<td class="float-right mr-3">' +
                        '<img alt="" height="50" id="icon" src=' + `https://openweathermap.org/img/wn/${result['data'].daily[i].weather[0].icon}@4x.png` + ' width="50" />' +
                        '</td>' +
                        '</tr>'
                    );
                }

            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                // console.log(errorThrown);
                // console.log("weather not working");
            }
        });
    }

    //displays country current time
    const displayCurrentTime = (lat, lan) => {
        $.ajax({
            url: "php/Timezone.php",
            type: 'GET',
            dataType: 'json',
            data: {
                LAT: lat,
                LAN: lan
            },
            success: function (result) {

                // console.log(result);

                $('.time').text(result['data'].time.replace(" ", " • "));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                // console.log(errorThrown);
                // console.log("time not working");
            }
        });
    }

    //displays current coronavirus data of selected country
    const coronavirusTracker = (code) => {
        $.ajax({
            url: "php/Coronavirus.php",
            type: 'GET',
            dataType: 'json',
            data: {
                CODE: code
            },
            success: function (result) {

                // console.log(result);
                var cases = result['data'].latest_data.confirmed;
                var deaths = result['data'].latest_data.deaths;
                var recovered = result['data'].latest_data.recovered;

                createPieChart(recovered, cases, deaths);
                createLineChart(Data.date, Data.caseData);
                $('#data-title').text(`${locationData.country} New Cases`);

                //clears each array
                Data.date.length = 0;
                Data.caseData.length = 0;
                Data.deathData.length = 0;
                Data.recoverData.length = 0;

                for (let i = 0; i < result['data'].timeline.length; i++) {

                    if (i < 50) {

                        //push date, case, death and recovered in an array
                        Data.date.push(result['data'].timeline[i].date);
                        Data.caseData.push(result['data'].timeline[i].new_confirmed);
                        Data.deathData.push(result['data'].timeline[i].new_deaths);
                        Data.recoverData.push(result['data'].timeline[i].new_recovered);
                    }
                }

                //reverse the data so its in chronological order
                Data.date.reverse();
                Data.caseData.reverse();
                Data.deathData.reverse();
                Data.recoverData.reverse();

                $("#daily-cases").click(function () {
                    createLineChart(Data.date, Data.caseData);
                    $('#data-title').text(`${locationData.country} New Cases`);
                });

                $("#daily-deaths").click(function () {
                    createLineChart(Data.date, Data.deathData);
                    $('#data-title').text(`${locationData.country} New Deaths`);
                });

                $("#daily-recovered").click(function () {
                    createLineChart(Data.date, Data.recoverData);
                    $('#data-title').text(`${locationData.country} New Recovered`);
                });

                $('#cases').text(`Total Cases: ${thousandSeparator(cases)}`);

            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                // console.log(errorThrown);
                // console.log("corona not working")
            }
        });
    }

    //shows latest news of country
    const latestNews = (code) => {
        $.ajax({
            url: "php/News.php",
            type: 'GET',
            dataType: 'json',
            data: {
                CODE: code
            },
            success: function (result) {

                // console.log(result);

                $('.news-articles ').empty();
                $(".news-articles ").append('<h1 class="card-title text-center">Latest News</h1>');

                if (result['data'].articles.length === 0) {
                    $(".news-articles").append('<div class="card justify-content-center ml-4 mb-2">' +
                        '<div class="card-body">' +
                        '<h5 id="news-title" class="card-title">No News</h5>' +
                        '<p id="news-description" class="card-text">News for this country is not available</p>' +
                        '<a id="news-link" href="" class="btn btn-primary" target="_blank">Read More</a>' +
                        '</div>' +
                        '</div>'
                    );
                    $("#news-link").addClass("disabled");
                } else if (result['data'].code === "rateLimited") {
                    $(".news-articles").append('<div class="card justify-content-center ml-4 mb-2">' +
                        '<div class="card-body">' +
                        '<h5 id="news-title" class="card-title">Api Request Limit</h5>' +
                        '<p id="news-description" class="card-text">News Api has reached its limited request.</p>' +
                        '<a id="news-link" href="" class="btn btn-primary" target="_blank">Read More</a>' +
                        '</div>' +
                        '</div>'
                    );
                    $("#news-link").addClass("disabled");
                } else {
                    for (let i = 0; i < result['data'].articles.length; i++) {

                        $(".news-articles").append('<div class="card justify-content-center ml-4 mb-2">' +
                            '<div class="card-body">' +
                            '<h5 id="news-title" class="card-title">' + result['data'].articles[i].title + '</h5>' +
                            '<p id="news-description" class="card-text">' + result['data'].articles[i].description + '</p>' +
                            '<a id="news-link" href=' + result['data'].articles[i].url + ' class="btn btn-primary" target="_blank">Read More</a>' +
                            '</div>' +
                            '</div>'
                        );
                    }
                }

            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                // console.log(errorThrown);
                // console.log("News not working")
            }
        });
    }

    //get gallery of photos of selected country 
    const Gallery = (country) => {
        $.ajax({
            url: "php/Pixabay.php",
            type: 'GET',
            dataType: 'json',
            data: {
                COUNTRY: country
            },
            success: function (result) {

                // console.log(result);

                $(".gallery-photos").empty();
                $(".gallery-photos").append('<h1 class="card-title text-center">Gallery</h1>');

                for (let i = 0; i < result['data'].hits.length; i++) {

                    $(".gallery-photos").append('<a href="' + result['data'].hits[i].largeImageURL + '"' + 'class="ml-4 mb-4"' + 'data-lightbox="mygallery"><img src="' + result['data'].hits[i].largeImageURL + '"' + 'alt=""></a>');
                }

            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                // console.log(errorThrown);
                // console.log("Photo image not working")
            }
        });
    }

    //turns on and tracks the ISS on the map every second
    $("#trackIss").on("click", function () {
        // alert("ee");
        inter = setInterval(function () {
            xhr = $.ajax({
                url: "php/ISS.php",
                type: 'GET',
                dataType: 'json',

                success: function (result) {

                    //console.log(result);
                    $("#trackIss").prop('disabled', true);
                    $("#trackIss").addClass("disabled");
                    $("#turnoff").prop('disabled', false);
                    $("#turnoff").removeClass("disabled");

                    issMarker.addTo(mymap);
                    issMarker.setLatLng([result['data'].latitude, result['data'].longitude]);
                    mymap.setView([result['data'].latitude, result['data'].longitude], 2);

                },
                error: function (jqXHR, textStatus, errorThrown) {
                    // your error code
                    // console.log(errorThrown);
                    // console.log("ISS not working")
                }
            });
        }, 1000);
    });

    //turns off the tracking of the ISS
    $("#turnoff").on("click", function () {
        // console.log("off");
        $("#turnoff").prop('disabled', true);
        $("#turnoff").addClass('disabled', true);
        $("#trackIss").prop('disabled', false);
        $("#trackIss").removeClass("disabled");

        xhr.abort();
        clearInterval(inter);
        mymap.removeLayer(issMarker);
    });

    //adds commas for integers that contain thousands
    const thousandSeparator = (num) => {
        var num_parts = num.toString().split(".");
        num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return num_parts.join(".");
    }

    //creates pie chart
    const createPieChart = (recovered, cases, deaths) => {
        Chart.defaults.global.defaultFontSize = 16;

        if (pieChart != null) {
            pieChart.destroy();
            // console.log('destroy');
        }

        pieChart = new Chart(ctx, {
            type: "pie",
            data: {
                labels: ["Recovered", "Active", "Deaths"],
                datasets: [
                    {
                        fill: true,
                        backgroundColor: ["green", "orange", "red"],
                        data: [recovered, cases - (recovered + deaths), deaths],
                    },
                ],
            }
        });
    }

    //creates line chart
    const createLineChart = (date, data) => {
        Chart.defaults.global.defaultFontSize = 16;

        if (lineChart != null) {
            lineChart.destroy();
        }

        lineChart = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: date,
                datasets: [{
                    data: data,
                    backgroundColor: "rgba(255,99, 132, 0.8)",
                    borderColor: "rgba(255,99, 132, 1)",
                },
                ]
            },
            options: {
                legend: {
                    display: false
                }
            }
        });
    }

    //removes geojson country borders
    var removeBorders = function () {
        mymap.eachLayer(function (layer) {

            if (geoJSON !== undefined) {
                mymap.removeLayer(geoJSON);
            }

        });
    }

});
