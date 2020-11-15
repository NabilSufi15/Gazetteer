<?php

//loops through json file for the requested country code
$borders = file_get_contents( __DIR__ . '/../json/countryBorders.geo.json');
$jsonObject = json_decode($borders, true); 
for($i=0; $i<count($jsonObject['features']); $i++) {
     if($jsonObject['features'][$i]['properties']['iso_a2'] === $_REQUEST['CODE']){
          echo json_encode($jsonObject['features'][$i]);
     }
}
?>