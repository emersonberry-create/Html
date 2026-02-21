alert("this feature is still in testing!")
const linkInput = document.getElementById("linkInput");;

linkInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        let url = linkInput.value.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://www.google.com/search?q=" + encodeURIComponent(url);
        }
        document.getElementById("contentFrame").src = url;
    }
});
