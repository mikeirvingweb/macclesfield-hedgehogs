var siteURL = "", siteName = "Macclesfield Hedgehogs", path = "", page = null;
var feed = null, feedHost = "https://macclesfield-hedgehogs.s3.eu-west-2.amazonaws.com/", feedURL = "./data/videos.json";
var monthNotes = null, monthNotesURL = "./data/notes.json";

function PathToPage(passedPage) {
    path = (passedPage != null && passedPage != "")? passedPage : window.location.pathname.toLowerCase();

	path = path.split('?')[0].split('&')[0].split('#')[0];
    
	var pathCleansed = path.replaceAll("macclesfield-hedgehogs", "").replaceAll("./", "").replaceAll("/", "");

    if(pathCleansed == "" || pathCleansed == "home")
        page = {url: "home", title: "Macclesfield Hedgehogs", metadesc: "A video diary of hedgehogs visiting a garden in Macclesfield.", metakey: "macclesfield hedgehogs, mice, video, wildlife, night vision, cameras"};
    else if(pathCleansed == "about")
        page = {url: "about", title: "About", metadesc: "All about the Macclesfield Hedgehogs website", metakey: "about, macclesfield, hedgehogs, website"};
	else if(pathCleansed == "footage")
        page = {url: "footage", title: "Footage", metadesc: "Video Footage of Macclesfield Hedgehogs", metakey: "footage, video, macclesfield, hedgehogs"};
	else if(pathCleansed == "cameras")
        page = {url: "cameras", title: "Cameras", metadesc: "Cameras used to capture footage of Macclesfield Hedgehogs.", metakey: "cameras, wildlife, arlo, ceyomur, xbro, xega, field camera"};
	else if(pathCleansed == "faqs")
        page = {url: "faqs", title: "FAQs", metadesc: "Frequently Asked Questions - Macclesfield Hedgehogs", metakey: "faq, faqs, frequesntly, asked, questions, macclesfield, hedgehogs, website"};
	else if(pathCleansed == "sitemap")
        page = {url: "sitemap", title: "Sitemap", metadesc: "Sitemap of the Macclesfield Hedgehogs website", metakey: "sitemap, site map, macclesfield, hedgehogs, website"};
	else
		page = {url: "404", title: "Page not found", metadesc: "", metakey: ""};
    
    return page;
}

function SetShareMetaTags(videoPage) {
	$("meta[property='og:title'], meta[name='twitter:title']").attr("content", document.title);
	$("meta[property='og:description'], meta[name='twitter:description']").attr("content", $("meta[name=description]").attr("content"));
	$("meta[property='og:url']").attr("content", window.location.href);

	let shareImageURL = videoPage? $($("video")[0]).attr("poster") : "images/macclesfield-hedgehogs-share.png";

	$("meta[property='og:image'], meta[name='twitter:image']").attr("content", shareImageURL);
}

function FirstLoad() {
	FetchNotes();

	let currentYear = new Date().getFullYear();
	$("#footerYear").text("2022" + ((currentYear > 2022)? " - " + currentYear : ""));

	LoadPage(PathToPage());
}

function FetchNotes() {
	$.get( monthNotesURL, function() {} )
	.done(function(data) {
		monthNotes = data;

		FetchFeed();
	})
	.fail(function() {
		feed = "failed";
		HideLoading();
	})
	.always(function() {} );
}

function FetchFeed() {
	$.get( feedURL, function() {} )
	.done(function(data) {
		feed = data;
		
		if(!(page.url != "home" || page.url == "sitemap"))
			HideLoading();
	})
	.fail(function() {
		feed = "failed";
		HideLoading();
	})
	.always(function() {} );
}

function HomePage() {
	if(feed == null) {
		ShowLoading();
		setTimeout(HomePage, 1000);
		return;
	}

	var camerasInFeed = new Set(feed.filter(x => x.Date < "2024-08-19").map(x => x.Camera));

	var processed = 0;

	if(camerasInFeed.size > 0) {
		var footage = "";

		camerasInFeed.forEach((item, i) => {
			if(processed < 3) {
				console.log(item);
				
				if(item == "Xbro-XC100")
					var latestFootage = feed.filter(x => x.Date < "2024-08-09").filter(x => x.Camera == item)[1];
				else
					var latestFootage = feed.filter(x => x.Date < "2024-08-19").filter(x => x.Camera == item)[0];

				footage += OutputClipRow(latestFootage, i, true);
			}

			processed++;
		});

		$("#footage").html(footage);
	}

	HideLoading();
}

function FootagePage() {
	if(feed == null) {
		ShowLoading();
		setTimeout(FootagePage, 1000);
		return;
	}

	var year = null, month = null, day = null, footage = "", hasThumbnail = false;

	var qsDate = GetQueryStringParameter("date"),
		qsDateSplit = null,
		qsVideo = GetQueryStringParameter("video");

	if(!IsNullOrEmpty(qsDate))
		qsDateSplit = qsDate.split('-');

	if(qsDateSplit != null && qsDateSplit.length == 1) {
		footage = OutputYearsAndMonths(qsDateSplit[0]);
	} else if(qsDateSplit != null && qsDateSplit.length == 2) {
		footage = OutputMonth(qsDateSplit[0], qsDateSplit[1]);
	} else if(qsDateSplit != null && qsDateSplit.length == 3) {
		footage = OutputDay(qsDateSplit[0], qsDateSplit[1], qsDateSplit[2]);
		hasThumbnail = true;
	} else if(!IsNullOrEmpty(qsVideo)) {
		footage = OutputVideo(qsVideo);
		hasThumbnail = true;
	}
	
	if(footage == "") {
		if(IsNullOrEmpty(qsDateSplit) && IsNullOrEmpty(qsVideo))
			footage = OutputYearsAndMonths();
		else
			footage = "no footage";
	}

	$("#footage").html(footage);

	WireUpLinks();

	document.title = $("p#title").text();
	SetShareMetaTags(hasThumbnail);

	if($(".video-playback video").length > 0)
		$(".video-playback video")[0].play();

	HideLoading();
}

function SitemapPage() {
	if(feed == null) {
		ShowLoading();
		setTimeout(SitemapPage, 1000);
		return;
	}

	var years = [], months = [];

	var html = "";

	feed.forEach((item) => {
		var year = item.Date.split("-")[0];

		if( (years[years.length -1] == null || years[years.length -1] != year) )
			years.push(year);
	});

	if(years.length > 0) {
		html += "<ul class=\"sitemap\">";

		years.forEach((year) => {
			html += "<li>";
			
			html += "<a href=\"footage?date=" + year + "\">" + year + "</a>";

			for(i=12; i>0; i--) {
				if(monthNotes.filter(x => x.year == parseInt(year) && parseInt(x.month) == i).length > 0)
					months.push(i);
			}

			if(months.length > 0) {
				html += "<ul>";

				months.forEach((month) => {
					html += "<li><a href=\"footage?date=" + year + "-" + PadNumber(month) + "\">" + monthNames[month - 1] + "</a></li>";
				});

				html += "</ul>";
			}

			html += "</li>";

			months = [];
		});

		html += "</ul>";
	}

	$("#footageSitemap").html(html);

	HideLoading();
}

function OutputYearsAndMonths(specificYear) {
	var years = [], months = [];

	var html = "";

	feed.forEach((item) => {
		var year = item.Date.split("-")[0];

		if( (specificYear == null || specificYear == year) && (years[years.length -1] == null || years[years.length -1] != year) )
			years.push(year);
	});

	if(!(years.indexOf(monthNotes[0].year.toString()) > -1)) {
		years.push(monthNotes[0].year.toString());
		years = years.sort().reverse();
	}

	if(years.length > 0) {
		const selectableNotice = "<p>Selectable entries are highlighted. Months with a hedgehog icon have confirmed hedgehog footage.</p>";

		if(IsNullOrEmpty(specificYear)) {
			$("#h1").text("All Footage");

			$("p#title").text("All Footage - " + siteName);

			html +=
				"<p>All months currently in the system.</p>" + 
				"<p>Please select a Year or Month.</p>" +
				selectableNotice;
		} else {
			$("#h1").text(specificYear);

			$("p#title").text("Footage from " + specificYear + " - " + siteName);

			html += "<p>Footage from " + specificYear + ".</p>" +
				"<p>Please select a month.</p>" +
				selectableNotice;

			html +=	"<div class=\"prev-next\">";

			var previous = feed.filter(x => !x.Date.startsWith(specificYear) && x.Date < specificYear).at(0)

			if(previous != null) {
				var prevYear = previous.Date.substring(0, 4);
				html += "<a class=\"button-link prev\" href=\"footage?date=" + prevYear + "\">" + prevYear + "</a>";
			}

			var next = feed.filter(x => !x.Date.startsWith(specificYear) && x.Date > specificYear).at(-1)

			if(next != null) {
				var nextYear = next.Date.substring(0, 4);
				html += "<a class=\"button-link next\" href=\"footage?date=" + nextYear + "\">" + nextYear + "</a>";
			}

			html += "</div>";
		}

		years.forEach((year) => {
			months = [];

			feed.filter(x => x.Date.startsWith(year)).forEach((item) => {
				var month = item.Date.split("-")[1];

				if(months[months.length -1] == null || months[months.length -1] != month)
					months.push(month)
			});

			html +=
				"<table class=\"calendar\">" +
					"<thead>" +
						"<tr>" +
							"<th colspan=\"4\">" + 
								((IsNullOrEmpty(specificYear))?
									"<a href=\"footage?date=" + year + "\">" + year + "</a>"
									:
									year
								) +
							"</th>" +
						"</tr>" +
					"</thead>"
					"<tbody>"
						"<tr>";

			for(var i = 0; i < 12; i++) {
				const notesFilter = monthNotes.filter(x => x.year == parseInt(year) && x.month == (i + 1)),
					notes = (notesFilter.length > 0)? notesFilter[0] : null,
					hedgehogs = (notes != null && notes.hedgehogs);

				html +=
					"<td class=\"" + (hedgehogs? "" : "no-") + "hedgehogs\">" +
						(((months.indexOf(PadNumber(i + 1)) > -1) || (notes != null))? "<a href=\"footage?date=" + year + "-" + PadNumber(i + 1) + "\">" : "") +
							"<div class=\"heading\"><span class=\"desktop-only-inline\">" + monthNames[i] + "</span><span class=\"mobile-only-inline\">" + monthNamesShort[i] + "</span></div>" +
							"<div class=\"count\"></div>" +
							((months.indexOf(PadNumber(i + 1)) > -1)? "</a>" : "")+
					"</td>";

				if(parseInt( (i+1) / 4 ) == ((i+1) / 4))
					html += "</tr><tr>";
			}

			html += "</tr>" +
				"</table>";
		});

		if(!IsNullOrEmpty(specificYear))
			html +=	"<p><a class=\"button-link back\" href=\"footage\">Back to All Years</a></p>";
	}

	return html;
}

function OutputMonth(specificYear, specificMonth) {
	var html = "", totalCount = 0;

	var monthFeed = feed.filter(x => x.Date.startsWith(specificYear + "-" + specificMonth));

	var notes = monthNotes.filter(x => x.year == parseInt(specificYear) && x.month == parseInt(specificMonth));

	if((monthFeed.length > 0) || (notes.length > 0)) {
		$("#h1").text(monthNames[parseInt(specificMonth) - 1] + " " + specificYear);

		$("p#title").text("Footage from " + monthNames[parseInt(specificMonth) - 1] + " " + specificYear + " - " + siteName);

		if(monthFeed.length > 0) {
			html += "<p>Footage from " + monthNames[parseInt(specificMonth) - 1] + " " + specificYear + ".</p>" +
				"<p>Selectable entries are highlighted.</p>";
		}

		if(notes.length > 0) {
			html += 
				((monthFeed.length > 0)? "<h2>Editor's notes</h2>" : "")+
				notes[0].notes;
		}
			
		html +=	"<div class=\"prev-next\">";

		var previous = feed.filter(x => !x.Date.startsWith(specificYear + "-" + specificMonth) && x.Date < specificYear + "-" + specificMonth).at(0);

		if(previous != null) {
			var prevYear = previous.Date.substring(0, 4), prevMonth = previous.Date.substring(5, 7);
			html += "<a class=\"button-link prev\" href=\"footage?date=" + prevYear + "-" + prevMonth + "\"><span class=\"desktop-only-inline\">" + monthNames[parseInt(prevMonth) - 1] + "</span><span class=\"mobile-only-inline\">" + monthNamesShort[parseInt(prevMonth) - 1] + "</span> " + prevYear + "</a>";
		}

		var next = feed.filter(x => !x.Date.startsWith(specificYear + "-" + specificMonth) && x.Date > specificYear + "-" + specificMonth).at(-1);

		if(next != null) {
			var nextYear = next.Date.substring(0, 4), nextMonth = next.Date.substring(5, 7);
			html += "<a class=\"button-link next\" href=\"footage?date=" + nextYear + "-" + nextMonth + "\"><span class=\"desktop-only-inline\">" + monthNames[parseInt(nextMonth) - 1] + "</span><span class=\"mobile-only-inline\">" + monthNamesShort[parseInt(nextMonth) - 1] + "</span> " + nextYear + "</a>";
		}

		html += "</div>";

		if(monthFeed.length > 0){
			var startDay = new Date(specificYear + "-" + specificMonth + "-01").getDay();

			if(startDay == 0)
				startDay = 7;

			html +=
				"<table class=\"calendar\">" +
					"<thead>" +
						"<tr><th colspan=\"7\">" + monthNames[parseInt(specificMonth) - 1] + " " + specificYear + "</th></tr>" +
						"<tr>" +
							"<th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th><th>S</th>" +
						"</tr>" +
					"</thead>"
					"<tbody>"
						"<tr>";

			if(startDay != 1) {
				for(i = 1; i < startDay; i++) {
					html += "<td></td>";
				}
			}

			for(i = 1; i <= DaysInMonth(specificYear, specificMonth); i++) {
				var dayItems = monthFeed.filter(x => x.Date.startsWith(specificYear + "-" + specificMonth + "-" + PadNumber(i))).length;
				totalCount += dayItems;
				
				html +=
					"<td>" +
						((dayItems < 1)? "" : "<a href=\"footage?date=" + specificYear + "-" + specificMonth + "-" + PadNumber(i) + "\" title=\"" + i + DayPostfix(i) + " " + monthNames[parseInt(specificMonth) - 1] + " " + specificYear + " - " + dayItems + " video" + ((dayItems > 1)? "s" : "") + "\">") +
							"<div class=\"heading\">" + i + "</div>" +
							((dayItems < 1)? "<div class=\"count-spacer\"></div>" : "<div class=\"count\"><span>" + dayItems + "</span></div>")
						+ ((dayItems < 1)? "" : "</a>") +
					"</td>";

				if(new Date(specificYear + "-" + specificMonth + "-" + PadNumber(i)).getDay() == 0)
					html += "</tr><tr>";
			}

			var lastDay = new Date(specificYear + "-" + specificMonth + "-" + PadNumber(DaysInMonth(specificYear, specificMonth))).getDay();

			if((lastDay > 0))
			{
				for(i = lastDay; i < 7; i++) {
					html += "<td></td>";
				}
			}

			html += "</tr>" +
				"</table>";
		}

		html +=
			"<div class=\"clear\"></div>" +
			"<p><a class=\"button-link back\" href=\"footage?date=" + specificYear + "\">Back to " + specificYear + "</a></p>";
	}
	
	return html;
}

function OutputDay(specificYear, specificMonth, specificDay) {
	var html = "", totalCount = 0;

	var dayFeed = feed.filter(x => x.Date.startsWith(specificYear + "-" + specificMonth + "-" + specificDay));

	if(dayFeed.length > 0) {
		var dateString = dayNames[DataDateToRealDate(dayFeed[0].Date).getDay()] + " " + DataDateToRealDate(dayFeed[0].Date).getDate() + DayPostfix(DataDateToRealDate(dayFeed[0].Date).getDate()) + " " + monthNames[DataDateToRealDate(dayFeed[0].Date).getMonth()] + " " + DataDateToRealDate(dayFeed[0].Date).getFullYear(),
			dateStringShort = dayNamesShort[DataDateToRealDate(dayFeed[0].Date).getDay()] + " " + DataDateToRealDate(dayFeed[0].Date).getDate() + DayPostfix(DataDateToRealDate(dayFeed[0].Date).getDate()) + " " + monthNamesShort[DataDateToRealDate(dayFeed[0].Date).getMonth()] + " " + DataDateToRealDate(dayFeed[0].Date).getFullYear();
		
		$("#h1").html("<span class=\"desktop-only-inline\">" + dateString + "</span><span class=\"mobile-only-inline\">" + dateStringShort + "</span>");

		$("p#title").text("Footage from " + dateStringShort + " - " + siteName);

		html += "<p>Footage from <span class=\"desktop-only-inline\">" + dateString + "</span><span class=\"mobile-only-inline\">" + dateStringShort + "</span>.</p>" +
			"<p>Click 'Play Video' or Tap the thumbnail to begin playback.</p>";

		html +=	"<div class=\"prev-next\">";

		var previous = feed.filter(x => !x.Date.startsWith(specificYear + "-" + specificMonth + "-" + specificDay) && x.Date < specificYear + "-" + specificMonth + "-" + specificDay).at(0)

		if(previous != null) {
			var prevYear = previous.Date.substring(0, 4), prevMonth = previous.Date.substring(5, 7), prevDay = previous.Date.substring(8, 10);

			var prevDateString = dayNames[DataDateToRealDate(previous.Date).getDay()] + " " + DataDateToRealDate(previous.Date).getDate() + DayPostfix(DataDateToRealDate(previous.Date).getDate()) + " " + monthNames[DataDateToRealDate(previous.Date).getMonth()] + " " + DataDateToRealDate(previous.Date).getFullYear(),
				prevDateStringShort = dayNamesShort[DataDateToRealDate(previous.Date).getDay()] + " " + DataDateToRealDate(previous.Date).getDate() + DayPostfix(DataDateToRealDate(previous.Date).getDate()) + " " + monthNamesShort[DataDateToRealDate(previous.Date).getMonth()];

			html += "<a class=\"button-link prev\" href=\"footage?date=" + prevYear + "-" + prevMonth + "-" + prevDay + "\"><span class=\"desktop-only-inline\">" + prevDateString + "</span><span class=\"mobile-only-inline\">" + prevDateStringShort + "</span></a>";
		}

		var next = feed.filter(x => !x.Date.startsWith(specificYear + "-" + specificMonth + "-" + specificDay) && x.Date > specificYear + "-" + specificMonth + "-" + specificDay).at(-1)

		if(next != null) {
			var nextYear = next.Date.substring(0, 4), nextMonth = next.Date.substring(5, 7), nextDay = next.Date.substring(8, 10);

			var nextDateString = dayNames[DataDateToRealDate(next.Date).getDay()] + " " + DataDateToRealDate(next.Date).getDate() + DayPostfix(DataDateToRealDate(next.Date).getDate()) + " " + monthNames[DataDateToRealDate(next.Date).getMonth()] + " " + DataDateToRealDate(next.Date).getFullYear(),
				nextDateStringShort = dayNamesShort[DataDateToRealDate(next.Date).getDay()] + " " + DataDateToRealDate(next.Date).getDate() + DayPostfix(DataDateToRealDate(next.Date).getDate()) + " " + monthNamesShort[DataDateToRealDate(next.Date).getMonth()];

			html += "<a class=\"button-link next\" href=\"footage?date=" + nextYear + "-" + nextMonth + "-" + nextDay + "\"><span class=\"desktop-only-inline\">" + nextDateString + "</span><span class=\"mobile-only-inline\">" + nextDateStringShort + "</span></a>";
		}
		
		html += "</div>";

		dayFeed.forEach((footage, i) => {
			html += OutputDayRow(footage, i, false);
		});

		html += "<p class=\"clear\"><a class=\"button-link back\" href=\"footage?date=" + specificYear + "-" + specificMonth + "\">Back to <span class=\"desktop-only-inline\">" + monthNames[parseInt(specificMonth) - 1] + "</span><span class=\"mobile-only-inline\">" + monthNamesShort[parseInt(specificMonth) - 1] + "</span> " + specificYear + "</a></p>";
	}
	
	return html;
}

function OutputDayRow(footage, i, showDate) {
	var dateString = dayNames[DataDateToRealDate(footage.Date).getDay()] + " " + DataDateToRealDate(footage.Date).getDate() + DayPostfix(DataDateToRealDate(footage.Date).getDate()) + " " + monthNames[DataDateToRealDate(footage.Date).getMonth()] + " " + DataDateToRealDate(footage.Date).getFullYear(),
		dateStringShort = dayNamesShort[DataDateToRealDate(footage.Date).getDay()] + " " + DataDateToRealDate(footage.Date).getDate() + DayPostfix(DataDateToRealDate(footage.Date).getDate()) + " " + monthNamesShort[DataDateToRealDate(footage.Date).getMonth()] + " " + DataDateToRealDate(footage.Date).getFullYear(),
		timeString = DataDateToRealDate(footage.Date).toTimeString().split(' ')[0];

	var html = "", hidden = (i >= 5);

	if( (i >= 5) && (parseInt(i / 5) == parseFloat(i / 5)) ) {
		html += "<div class=\"div-more" + ((i >= 10)? " hidden" : "") + "\" id=\"divMore" + i + "\"><hr><a class=\"button-link more special\" onclick=\"return ShowMore(" + i + ");\">Show More</a><hr></div>";
	}

	html +=
		"<section id=\"videoRow" + i + "\"" + ((hidden)? " class=\"hidden\"" : "") + ">" +
			"<hr>" +
			"<section class=\"video-row\">" +
				"<section class=\"video-holder\">" +
					"<a href=\"footage?video=" + footage.Key + "\">" +
						"<img alt=\"" + siteName + " clip from " + dateString + ", " + timeString + ". Camera: " + GetNiceCameraName(footage.Camera) + "\" src=\"" + feedHost + footage.Key + ".jpg\">" +
					"</a>" +
				"</section>" +
				"<section class=\"video-details\">" +
				"<p><a class=\"button-link play\" id=\"video-" + i + "\" href=\"footage?video=" + footage.Key + "\">Play Video</a></p>" +
					((showDate)? "<p><span class=\"desktop-only-inline\">Date:&nbsp;</span><span class=\"desktop-only-inline\">" + dateString + "</span><span class=\"mobile-only-inline\">" + dateStringShort + "</span></p>" : "") +
					"<p><span class=\"desktop-only-inline\">Time:&nbsp;</span>" + timeString + "</p>" +
					"<p><span class=\"desktop-only-inline\">Camera:&nbsp;</span><a href=\"cameras#" + footage.Camera + "\" title=\"Click for info on the " + GetNiceCameraName(footage.Camera) + " camera.\">" + GetNiceCameraName(footage.Camera) + "</a></p>" +
				"</section>" +
			"</section>" +
		"</section>";

	return html;
}

function ShowMore(i) {
	$("#divMore" + i).remove();

	var moreMores = $(".div-more");

	if(moreMores.length > 0)
		$($(".div-more")[0]).removeClass("hidden");

	ShowVideoRow(i, (i + 5));
	
	return false;
}

function ShowVideoRow(i, stop) {
	$("#videoRow" + i).html($("#videoRow" + i).html()).slideDown(null, function() {
		i++;

		if(i < stop)
			ShowVideoRow(i, stop);
	});
}

function OutputClipRow(footage, i) {
	var dateString = dayNamesShort[DataDateToRealDate(footage.Date).getDay()] + " " + DataDateToRealDate(footage.Date).getDate() + DayPostfix(DataDateToRealDate(footage.Date).getDate()) + " " + monthNames[DataDateToRealDate(footage.Date).getMonth()],
		dateStringShort = DataDateToRealDate(footage.Date).getDate() + DayPostfix(DataDateToRealDate(footage.Date).getDate()) + " " + monthNamesShort[DataDateToRealDate(footage.Date).getMonth()],
		timeString = DataDateToRealDate(footage.Date).toTimeString().split(' ')[0];

	var html =
		"<section class=\"clip\">" +
			"<section class=\"clip-holder\">" +
				"<a href=\"footage?video=" + footage.Key + "\">" +
					"<img alt=\"" + siteName + " clip from " + dateString + ", " + timeString + ". Camera: " + GetNiceCameraName(footage.Camera) + "\" src=\"" + feedHost + footage.Key + ".jpg\">" +
				"</a>" +
			"</section>" +
			"<section class=\"clip-details\">" +
				"<p>" +
					"<a class=\"button-link play desktop-only\" id=\"video-" + i + "-1\" href=\"footage?video=" + footage.Key + "\">Play Video</a>" +
					"<a class=\"button-link play mobile-only\" id=\"video-" + i + "\" href=\"footage?video=" + footage.Key + "\">Play</a>" +
				"</p>" +
				"<p>" +
					"<span class=\"desktop-only-inline\">" + dateString + "</span><span class=\"mobile-only-inline\">" + dateStringShort + "</span>" +
					"<span class=\"desktop-only-inline\">&nbsp;</span><span class=\"mobile-only-inline\"><br></span>" +
					timeString +
				"</p>" +
				"<p class=\"camera-name\"><span class=\"desktop-only-inline\">Camera:&nbsp;</span><a href=\"cameras#" + footage.Camera + "\" title=\"Click for info on the " + GetNiceCameraName(footage.Camera) + " camera.\">" + GetNiceCameraName(footage.Camera) + "</a></p>" +
			"</section>" +
		"</section>";
	
	return html;
}

function OutputVideo(video) {
	var html = "";

	var footage = feed.filter(x => x.Key.indexOf(video) > -1);

	if(footage.length > 0){
		var dateString = dayNames[DataDateToRealDate(footage[0].Date).getDay()] + " " + DataDateToRealDate(footage[0].Date).getDate() + DayPostfix(DataDateToRealDate(footage[0].Date).getDate()) + " " + monthNames[DataDateToRealDate(footage[0].Date).getMonth()] + " " + DataDateToRealDate(footage[0].Date).getFullYear(),
			dateStringShort = dayNamesShort[DataDateToRealDate(footage[0].Date).getDay()] + " " + DataDateToRealDate(footage[0].Date).getDate() + DayPostfix(DataDateToRealDate(footage[0].Date).getDate()) + " " + monthNamesShort[DataDateToRealDate(footage[0].Date).getMonth()] + " " + DataDateToRealDate(footage[0].Date).getFullYear(),
			timeString = DataDateToRealDate(footage[0].Date).toTimeString().split(' ')[0];

		$("#h1").html("<span class=\"desktop-only-inline\">" + dateString + "</span><span class=\"mobile-only-inline\">" + dateStringShort + "</span> at " + timeString);

		$("p#title").text("Footage from " + dateStringShort + " at " + timeString + " - " + siteName);
	
		html += "<p>Footage from <span class=\"desktop-only-inline\">" + dateString + "</span><span class=\"mobile-only-inline\">" + dateStringShort + "</span> at " + timeString + ".</p>";
		html += "<p>Taken on the <a href=\"cameras#" + footage[0].Camera + "\">" + GetNiceCameraName(footage[0].Camera) + "</a> camera.</p>";

		html +=	"<div class=\"prev-next\">";

		var currentPosition = feed.findIndex(x => x.Key.indexOf(video) > -1)

		if(currentPosition < (feed.length - 1)) {
			var previous = feed[currentPosition + 1];

			if(previous != null) {
				html += "<a class=\"button-link prev\" href=\"footage?video=" + previous.Key + "\">Previous Video</a>";
			}
		}

		if(currentPosition > 0) {
			var next = feed[currentPosition - 1];

			if(next != null) {
				html += "<a class=\"button-link next\" href=\"footage?video=" + next.Key + "\">Next Video</a>";
			}
		}

		html += "</div>";

		html +=
			"<section class=\"clear video-playback\">" +
				"<section class=\"video-holder\">" +
					"<video controls playsinline autoplay poster=\"" + feedHost + footage[0].Key + ".jpg\">" +
						"<source src=\"" + feedHost + footage[0].Key + "#t=0.001\"></source>" +
					"</video>" +
				"</section>" +
				"<hr>" +
				"<section class=\"video-details\">" +
					"<p><span class=\"desktop-only-inline\">Date:&nbsp;</span><span class=\"desktop-only-inline\">" + dateString + "</span><span class=\"mobile-only-inline\">" + dateStringShort + "</span></p>" +
					"<p><span class=\"desktop-only-inline\">Time:&nbsp;</span>" + timeString + "</p>" +
					"<p><span class=\"desktop-only-inline\">Camera:&nbsp;</span><a href=\"cameras#" + footage[0].Camera + "\" title=\"Click for info on the " + GetNiceCameraName(footage[0].Camera) + " camera.\">" + GetNiceCameraName(footage[0].Camera) + "</a></p>" +
				"</section>" +
			"</section>" +
			"<p><a class=\"button-link back\" href=\"footage?date=" + video.substring(0, 10) + "\">Back to <span class=\"desktop-only-inline\">" + dateString + "</span><span class=\"mobile-only-inline\">" + dateStringShort + "</span></a></p>";
	}
	
	return html;
}

/* SPWA */
function ShowLoading() {
	$(".loading").show()
}

function HideLoading() {
	$(".loading").hide()
}

var firstContent = true;

function NewContentLoadedFunctions(page) {
	ScrollToTop();

	$("#contentDiv").fitVids();
	
	WireUpLinks();

	$("a.external").click(function(){
		ToggleMenu(true);
	});
	
	document.title = page.title + ((page.url == "home")? "" : " - " + siteName);
	$("meta[name=description]").attr("content", page.metadesc);
	$("meta[name=keywords]").attr("content", page.metakey);

	SetShareMetaTags();
	
	$("nav li a").removeClass("active");
	$("nav li a.nav-link-" + page.url).addClass("active");

	if(!(page.url == "home" || page.url == "sitemap"))
		HideLoading();
	
	if(page.url == "footage") {
		FootagePage();
	}

	if(page.url == "home") {
		HomePage();
	}

	if(page.url == "sitemap") {
		setTimeout(SitemapPage, 100);
	}
	
	firstContent = false;
	
	if(!(IsNullOrEmpty(window.location.hash.substring(1))))
		setTimeout(function() { JumpToAnchor(window.location.hash.substring(1)); }, 500);
}

function WireUpLinks() {
	$("a:not(.external):not(.special)").off('click').click(function(){
		var gotoUrl = $(this).attr("href");
		
		PushOrPopThenLoadPage(gotoUrl, true);
		return false;
	});
}

function LoadPage(page) {
	ShowLoading();
	
	$.get( "./content/" + page.url.split("?")[0] + ".html", function() {} )
	.done(function(data) {
		$("#contentDiv").html(data);
		NewContentLoadedFunctions(page);
	})
	.fail(function() {})
	.always(function() {} );
}

function PushOrPopThenLoadPage(href, push) {
	ToggleMenu(true);
	
	if(push)
		window.history.pushState({urlPath:href}, "", href);
	
	LoadPage(PathToPage(href));
}

window.onpopstate = function(event) {
	PushOrPopThenLoadPage(document.location.pathname, false);
};

/* Other */
$(function () {
    $('body').on('click', '.btnMenu',
		function (e) {
			e.preventDefault();
			ToggleMenu();
		}
	);
});

function ToggleMenu(forceClose) {
    if (($('nav.navMob').is(':hidden')) && !(forceClose != null && forceClose == true) ) {
        $("#menu").css({ opacity: 0.25 });
        $("nav.navMob").slideDown(400);
    }
    else {
        $("#menu").css({ opacity: 1.0 });
        $("nav.navMob").slideUp(200);
    }
}

function ScrollToTop() {
    window.scrollTo(0, 0);
}

function JumpToAnchor(anchor) {
	if($("#" + anchor).length > 0)
    	window.scrollTo(0, $("#" + anchor)[0].offsetTop + $("#" + anchor)[0].offsetParent.offsetTop);
}

function IsNullOrEmpty(inString) {
	return (inString == null || inString == "");
}

function DaysInMonth(year, month) {
	return new Date(year, month, 0).getDate();
}

function PadNumber(number) {
	return number.toLocaleString('en-GB', {minimumIntegerDigits: 2});
}

function DataDateToRealDate(dataDate) {
	var dataDateSplit = dataDate.split('-');

	return new Date(dataDateSplit[0] + "-" + dataDateSplit[1] + "-" + dataDateSplit[2] + "T" + dataDateSplit[3] + ":" + dataDateSplit[4] + ":" + dataDateSplit[5]);
}

function GetQueryStringParameter(parameter) {
	let params = (new URL(document.location)).searchParams;
	return params.get(parameter);
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function DayPostfix(day) {
	if(day == 1 || day == 21 || day == 31)
		return "st";
	else if(day == 2 || day == 22)
		return "nd";
	else if(day == 3 || day == 23)
		return "rd";
	else
		return "th";
}

function GetNiceCameraName(name) {
	return name.replace("-", " ");
}

function Goto(url, params) {
	if(params != null && params != "")
		window.open(url, "_blank", params);
	else
		window.open(url, "_blank");
}

function ShareSocial(sType) {
	var sWhat = escape(window.location.href);
	var sTitle = escape(document.title);
	var sParams = "width=320,height=480";
	
	if(sType == "facebook") {
		Goto("https://www.facebook.com/sharer/sharer.php?u=" + sWhat, sParams);
	}
	else if(sType == "linkedin") {
		Goto("https://www.linkedin.com/shareArticle?mini=true&url=" + sWhat + "&title=" + sTitle + "&summary=", sParams);
	}
	else if(sType == "twitter") {
		Goto("https://twitter.com/intent/tweet/?text=" + sTitle + "&url=" + sWhat, sParams);
	}	
}