<%EnableSessionState=False
host = Request.ServerVariables("HTTP_HOST")

if host = "example.com" or host = "www.example.com" then
response.redirect("https://www.nabilsufi.co.uk/")

else
response.redirect("https://www.nabilsufi.co.uk/error.htm")

end if
%>