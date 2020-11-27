<%EnableSessionState=False
host = Request.ServerVariables("HTTP_HOST")

if host = "nabilsufi.co.uk" or host = "www.nabilsufi.co.uk" or host = "http://www.nabilsufi.co.uk"  then
response.redirect("https://www.nabilsufi.co.uk/")

else
response.redirect("https://www.nabilsufi.co.uk/error.htm")

end if
%>