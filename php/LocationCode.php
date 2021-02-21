<?php

	$executionStartTime = microtime(true) / 1000;

	// concatenates the url for the API call with the parameters.
    $url= 'https://api.opencagedata.com/geocode/v1/json?q=' . $_REQUEST['CODE'] . '&key=bdd7c45dadb6456c8643e18b24c03baf';

	//  initiates the cURL object and sets some parameters. These are often documented by the 
	// API provider and the ones that you see are the most used and will workin many scenarios.
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);

	// executes the cURL object and stores the results to $result.
	$result=curl_exec($ch);

	curl_close($ch);

	//This particular API returns data as JSON and so we decode it as an 
	// associativearray so that we can append it to $output.
	$decode = json_decode($result,true);	

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "mission saved";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	$output['data'] = $decode['results'];
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>
