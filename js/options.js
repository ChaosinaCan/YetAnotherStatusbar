
var style = null;

/**
 * Updates the text of a number of elements on the page
 */
function setText(items) {
	for (var i = 0; i < items.length; i++)
		$(items[i][0]).text(items[i][1]);
}

function updateStyle() {
	var theme = settings.style;
	var stylesheet = opera.extension.getFile('/css/statusbar.' + theme + '.css');
	var fr = new FileReader();

	fr.onload = function() {
		var sheet = fr.result.replace(/html\s*>/g, '').replace(/!important/g, '');
		$(style).empty();
		style.appendChild(document.createTextNode(sheet));
	}

	fr.readAsText(stylesheet);
}

/** Init **/
$(function() {
	// Update the version text
	setText([
		['#widget-name', widget.name],
		['#widget-version', widget.version],
		['#widget-author', widget.author],
	])

	style = document.createElement('style');
	document.head.appendChild(style);

	updateStyle();

	window.addEventListener('settings', function(e) {
		if (e.detail.key === 'style')
			updateStyle();
	}, false);
})

/** Debug **/
$(window).keypress(function(e) {
	if (e.target.nodeName == 'INPUT' || e.target.nodeName == 'TEXTAREA')
		return;
	
	if (e.keyCode == 96 || e.keyCode == 126) {
		$('#storage_list').empty().append(OptionsPage.debugStorage());
	}
	
	if (e.keyCode == 96)
		$('#debug').toggle();
})