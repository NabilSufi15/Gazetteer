$(document).ready(function () {

    //Object containing data for location
    const locationData = {
        code: '',
        city: '',
        country: '',
        lat: '',
        lan: '',
        iso: ''
    };

    //global variables
    var geoJSON
    var pieChart = null;
    var barChart = null;
    var ctx = document.getElementById("pieChart").getContext("2d");
    var ctx2 = document.getElementById("barChart").getContext("2d");
    var xhr;
    var inter;
    var issIcon = L.icon({
        iconUrl: 'images/ISS.png',
        iconSize: [50, 50], // size of the icon
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    const issMarker = L.marker([0, 0], { icon: issIcon });

    //disables nav buttons on start of application
    $("#infoButton").prop('disabled', true);
    $("#weatherButton").prop('disabled', true);
    $("#virusButton").prop('disabled', true);

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

                    $("#infoButton").prop('disabled', false);
                    $("#weatherButton").prop('disabled', false);
                    $("#virusButton").prop('disabled', false);

                    locationData.code = result['data'][0].components.country_code.toUpperCase();
                    locationData.country = result['data'][0].components.country;
                    locationData.continent = result['data'][0].components.continent;
                    locationData.lat = result['data'][0].geometry.lat;
                    locationData.lan = result['data'][0].geometry.lng;
                    locationData.iso = result['data'][0].components['ISO_3166-1_alpha-3'];

                    //displays the selected country using the country code
                    displayCountryBorder(locationData.code);
                    displayCountryInfo(locationData.code);
                    displaySummary(locationData.country);
                    coronavirusTracker(locationData.code);
                    displayWeather(locationData.lat, locationData.lan);
                    displayCurrentTime(locationData.lat, locationData.lan);

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
                geoJSON = L.geoJson(result);
                geoJSON.addTo(mymap);

                //zooms into selcted country
                mymap.flyToBounds(geoJSON.getBounds(), {
                    padding: [50, 50],
                    maxZoom: 18,
                    animate: true,
                    duration: 2
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                console.log(errorThrown);
                console.log("border not working")
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
                console.log(errorThrown);
                console.log("rest not working")
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

                $('#summary').text(result['data'][0].summary);
                $('#wiki').attr('href', `https://${result['data'][0].wikipediaUrl}`);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                console.log(errorThrown);
                console.log("summary not working")
            }
        });
    }

    //displays current weather
    const displayWeather = (lat, lan) => {
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
                $('#icon').attr('src', `http://openweathermap.org/img/wn/${result['data']['weather'][0].icon}@4x.png`);
                $('#temperature').text(`${Math.ceil(temp)}°`); //"°C"
                $('#description').text(`${result['data']['weather'][0].description}`);
                $('#humidity').text(`${result['data'].main.humidity}%`);
                $('#speed').text(`${result['data'].wind.speed} m/h`);
                $('#cloud').text(`${result['data'].clouds.all}%`);
                $('#pressure').text(`${result['data'].main.pressure} hPa`);

            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                console.log(errorThrown);
                console.log("weather not working")
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
                console.log(errorThrown);
                console.log("time not working")
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

                console.log(result);
                var cases = result['data'].latest_data.confirmed;
                var deaths = result['data'].latest_data.deaths;
                var recovered = result['data'].latest_data.recovered;

                var todayCases = result['data'].timeline[0].new_confirmed;
                var todayDeaths = result['data'].timeline[0].new_deaths;
                var todayRecovered = result['data'].timeline[0].new_recovered;

                createPieChart(recovered, cases, deaths);
                createBarChart(todayRecovered, todayCases, todayDeaths);

                $('#cases').text(`Total Cases: ${thousandSeparator(cases)}`);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // your error code
                console.log(errorThrown);
                console.log("corona not working")
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

                    $("#trackIss").addClass("disabled");
                    $("#turnoff").prop('disabled', false);
                    $("#turnoff").removeClass("disabled");

                    issMarker.addTo(mymap);
                    issMarker.setLatLng([result['data'].latitude, result['data'].longitude]);
                    mymap.setView([result['data'].latitude, result['data'].longitude], 2);

                },
                error: function (jqXHR, textStatus, errorThrown) {
                    // your error code
                    console.log(errorThrown);
                    console.log("ISS not working")
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

    // creats bar chart
    const createBarChart = (recovered, cases, deaths) => {
        Chart.defaults.global.defaultFontSize = 16;

        if (barChart != null) {
            barChart.destroy();
            // console.log('destroy');
        }

        barChart = new Chart(ctx2, {
            type: "bar",
            data: {
                labels: ["Recovered", "Cases", "Deaths",],
                datasets: [
                    {
                        fill: true,
                        backgroundColor: ["green", "orange", "red"],
                        data: [recovered, cases, deaths],
                    },
                ],
            },
            options: {
                legend: {
                    display: false
                }
            },
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
