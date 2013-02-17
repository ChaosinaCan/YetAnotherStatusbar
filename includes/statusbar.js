var HIDE_TIMEOUT = 300;// Time between mouse out and hiding the statusbar

var EXPAND_TIMEOUT = 1000;// Time between mouse over and expand

var ANIM_LENGTH = 300;// Duration of fade in/out

var MAX_WIDTH = 500;// Max width of the unexpanded statusbar

// Assume anything that doesn't have an <a> as a parent X levels up isn't
// part of a link. We might miss some links, but this will be much faster.
var MAX_TRAVERSE = 5;
var statusbar = null;
var style = null;
var protocolText = null;
var subdomainText = null;
var domainText = null;
var pathText = null;
var hideTimeoutId = null;
var expandTimeoutId = null;
var removeTimeoutId = null;
var currentTarget = null;
var isExpanded = false;
var parentOrigin = null;
/** Initializes the statusbar */
function init() {
    EXPAND_TIMEOUT = JSON.parse(widget.preferences['expand']);
    var stylesheet = opera.extension.getFile('/css/statusbar.' + JSON.parse(widget.preferences['style']) + '.css');
    var fr = new FileReader();
    fr.onload = function () {
        statusbar = document.createElement('operastatusbar');
        statusbar.style.display = 'none';
        statusbar.style.opacity = '0';
        statusbar.addEventListener('mouseenter', hideMouseover, false);
        protocolText = document.createElement('operastatusspan');
        protocolText.className = 'protocol';
        domainText = document.createElement('operastatusspan');
        domainText.className = 'domain';
        subdomainText = document.createTextNode('');
        pathText = document.createTextNode('');
        statusbar.appendChild(protocolText);
        statusbar.appendChild(subdomainText);
        statusbar.appendChild(domainText);
        statusbar.appendChild(pathText);
        document.documentElement.appendChild(statusbar);
        style = document.createElement('style');
        style.appendChild(document.createTextNode(fr.result));
        document.head.appendChild(style);
        document.body.addEventListener('mouseover', mouseover, false);
    };
    fr.readAsText(stylesheet);
}
function initFrame() {
    parentOrigin = window.parent.location.protocol + '//' + window.parent.location.host;
    document.body.addEventListener('mouseover', mouseoverFrame, false);
}
function findAnchor(target) {
    var t = MAX_TRAVERSE;
    while(t > 0 && target && target.nodeName !== 'A' && target.nodeName !== 'AREA') {
        target = target.parentElement;
        --t;
    }
    if(!target || !(target).href) {
        return null;
    }
    return target;
}
/**
* Displays the statusbar
* @param e {MouseEvent} the mouseover event for any element
*/
function mouseover(e) {
    var target = findAnchor(e.target);
    if(!target) {
        return;
    }
    clearTimeout(hideTimeoutId);
    clearTimeout(expandTimeoutId);
    clearTimeout(removeTimeoutId);
    if(currentTarget !== target) {
        currentTarget = target;
        show({
            href: target.href,
            protocol: target.protocol,
            hostname: target.hostname,
            clientX: e.clientX,
            clientY: e.clientY
        });
    }
    // set the statusbar to expand after a moment
    expandTimeoutId = setTimeout(function () {
        statusbar.style.maxWidth = document.documentElement.clientWidth + 'px';
        isExpanded = true;
    }, EXPAND_TIMEOUT);
    // hide the statusbar when the mouse exits the hovered element
    function onMouseOut(e) {
        hide();
        target.removeEventListener('mouseout', onMouseOut, false);
    }
    target.addEventListener('mouseout', onMouseOut, false);
}
function mouseoverFrame(e) {
    var target = findAnchor(e.target);
    if(!target) {
        return;
    }
    if(currentTarget !== target) {
        currentTarget = target;
        window.parent.postMessage({
            operaStatusBarEvent: 'show',
            linkdata: {
                href: target.href,
                protocol: target.protocol,
                hostname: target.hostname,
                clientX: e.clientX,
                clientY: e.clientY
            }
        }, parentOrigin);
    }
    function onMouseOut(e) {
        window.parent.postMessage({
            operaStatusBarEvent: 'hide'
        }, parentOrigin);
        target.removeEventListener('mouseout', onMouseOut, false);
    }
    target.addEventListener('mouseout', onMouseOut, false);
}
function show(linkdata) {
    var url = linkdata.href;
    var protocol = linkdata.protocol.replace(':', '');
    var domain = linkdata.hostname;
    var subdomain = '';
    // Find the subdomain (if any)
    var domainParts = domain.split('.');
    if(domainParts.length > 2) {
        subdomain = domainParts.shift() + '.';
        domain = domainParts.join('.');
    }
    // number of characters between protocol and subdomain
    var sepLength = 1;
    while(url.charAt(protocol.length + sepLength) === '/') {
        sepLength += 1;
    }
    protocolText.textContent = protocol;
    subdomainText.textContent = subdomain;
    domainText.textContent = domain;
    pathText.textContent = decodeURIComponent(url.substr(protocol.length + sepLength + subdomain.length + domain.length).trim());
    statusbar.className = protocol;
    statusbar.style.display = 'block';
    statusbar.style.maxWidth = isExpanded ? '100%' : Math.min(MAX_WIDTH, document.documentElement.clientWidth) + 'px';
    // If the mouse is over where the statusbar should appear, don't show the statusbar
    var box = statusbar.getBoundingClientRect();
    if(linkdata.clientX > box.left && linkdata.clientX < box.right && linkdata.clientY > box.top && linkdata.clientY < box.bottom) {
        hideMouseover();
        return;
    }
    // set the statusbar to fade in
    setTimeout(function () {
        statusbar.style.opacity = '1';
    }, 0);
}
/** Hides the statusbar by fading it out */
function hide() {
    clearTimeout(expandTimeoutId);
    clearTimeout(removeTimeoutId);
    // wait for a moment before hiding
    hideTimeoutId = setTimeout(function () {
        isExpanded = false;
        currentTarget = null;
        statusbar.style.opacity = '0';
        // fade the statusbar out
        removeTimeoutId = setTimeout(function () {
            statusbar.style.display = 'none';
        }, ANIM_LENGTH);
    }, HIDE_TIMEOUT);
}
/** Hides the statusbar immediately (for when it is moused-over) */
function hideMouseover() {
    clearTimeout(expandTimeoutId);
    clearTimeout(removeTimeoutId);
    clearTimeout(hideTimeoutId);
    isExpanded = false;
    currentTarget = null;
    statusbar.style.opacity = '0';
    statusbar.style.display = 'none';
}
function onMessage(e) {
    var event;
    if(typeof e.data === 'object' && (event = e.data.operaStatusbar)) {
        if(event === 'show') {
            show(e.data.linkdata);
        } else if(event === 'hide') {
            hide();
        }
    }
}
function onLoad() {
    // Frames are hard. Ignore them for now
    if(window === window.top || window.document.body instanceof (window).HTMLFrameSetElement) {
        console.log('top');
        init();
        window.addEventListener('message', onMessage, false);
        // Kill the statusbar if the extension gets disabled
        opera.extension.addEventListener('disconnect', function () {
            document.body.removeEventListener('mouseover', mouseover, false);
            hide();
        }, false);
    } else {
        console.log(document.body);
        console.log('frame');
        initFrame();
        opera.extension.addEventListener('disconnect', function () {
            document.body.removeEventListener('mouseover', mouseoverFrame, false);
        }, false);
    }
}
// For local files, page might be completely loaded before script runs
if(document.readyState === 'interactive' || document.readyState === 'complete') {
    onLoad();
} else {
    window.addEventListener('DOMContentLoaded', onLoad, false);
}
