shuffle = function(o, n){ //v1.0
	for(var j, x, i = n || o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

_id = function (str) {
	if (typeof str == "number") {
	  str = str + '';
	}
	if (typeof str != "string") {
		alert('str is wadesda?' + str);
	}
  return str ? "#" + str.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g,'\\$1') : "#cestmalindedonnerunestringvide";
}

// target can be node target or id.
selectTab = function(target) {
	target = $(target).parents().andSelf().filter(".tab").addClass('selected');
	target.siblings().toggleClass('selected', false);
	$(_id("stage1")).toggle(target.attr('id') == 'tab1');
	$(_id("stage2")).toggle(target.attr('id') == 'tab2');
	$(_id("standings")).toggle(target.attr('id') == 'tab3');
}

/** The voting panel: display, voting and returing results. */
Panel = function(id) {
	this.panelEl = $(_id(id));
	this.left = null;
	this.right = null;
	this.pool = null;
	
	this.show = function(img1, img2, title, pool) {
		this.pool = pool;
		try {
			this.panelEl.show();
			$('#contest-panel-title').html(title);
			var offset = window.scrollY;
		  this.panelEl.parent()[0].style.top = offset;
			this.slide1 = $(img1);
			this.left = $('#left').replaceWith(this.slide1.clone().attr('id', 'playerLeft'));
			if (img2) {
				this.slide2 = $(img2);
				this.right = $('#right').replaceWith(this.slide2.clone().attr('id', 'playerRight'));
			} else {
				this.slide2 = null;
			}
		} catch(exception) {
			alert(exception);
		}
	}
	
	this.hide = function() {
		this.panelEl.hide();
		if (this.left) $('#playerLeft').replaceWith(this.left);
		if (this.right) $('#playerRight').replaceWith(this.right);
	}
	
	this.activate = function(event) {
		try {
			var stripEl = $(event.target).parents(".slide");
			if (stripEl.attr('id') == 'playerLeft') {
				this.pool.saveResults(this.slide1, this.slide2);
			} else {
				this.pool.saveResults(this.slide2, this.slide1);
			}
		} catch(exception) {
			alert(exception);
		}
	}
}

/** The mini 2-brackets pool qualifications. */
Stage1Pool = function(poolid, standings) {
	try {
		this.poolid = poolid;
		this.poolEl = $(_id(poolid));
		this.players = this.poolEl.children();
		this.topBracket = [];
		this.winnowBracket = [];
		this.bottomBracket = [];
		this.nextRound = [];  // DOM objects.
		this.rip = [];
		this.currentRound = 'T0';
		this.numAlive = 0;
		this.standings = standings;
		for (var player, i=0; player = this.players[i]; i++) {
			this.nextRound.push(player);
			this.numAlive++;
			standings.register(player);
		}
		this.numStage2Leaves = ($('#stage2 .slide').size() + 1) / 2;
	} catch (exception) {
		alert(exception);
	}
	
	this.play = function() {
		var title;
		if (this.numAlive == 2) {
			this.nextRound.push(this.topBracket[0]);
			this.nextRound.push(this.bottomBracket[0]);
			title = 'Final qualification';
		} else {
			if (this.nextRound.length == 0) {
				if (this.currentRound == 'T0' || this.currentRound == 'W') {
					this.currentRound = 'E';
					for (var player; player = this.bottomBracket.shift();) {
						this.nextRound.push(player);
					}
				} else if (this.currentRound == 'E') {
					this.currentRound = 'T';
					for (var player; player = this.topBracket.shift();) {
						this.nextRound.push(player);
					}
				} else if (this.currentRound == 'T') {
					this.currentRound = 'W';
					for (var player; player = this.bottomBracket.shift();) {
						this.nextRound.push(player);
						this.nextRound.push(this.winnowBracket.shift());
					}
				}
			}
			title = 'Round: ' + this.currentRound;			
		}
		var img1 = this.nextRound.shift();
		var img2 = this.nextRound.shift();
		if (img2) {
			$.contest.panel.show(img1, img2, title, this);
		} else {
			this.saveResults($(img1));
		}
	}
	
	this.saveResults = function(winnerEl, loserEl) {
		if (this.numAlive == 2) {
		// Final standings: winnerEl is the top qualified, loserEl (if any) is the second qualified.
			if (loserEl) {
				this.rip.unshift(loserEl.remove());
				this.standings.recordWin(loserEl);
			}
			this.rip.unshift(winnerEl.remove());
			this.standings.recordWin(winnerEl);
			this.orderChildren();
			var numPool = this.poolid.slice(5);
			var id = 2 * numPool - 2 + this.numStage2Leaves;
			$(_id(id)).replaceWith(winnerEl.clone().attr('id', id));
			if(loserEl) {
				id = 2 * this.numStage2Leaves + 1 - 2 * numPool;
				$(_id(id)).replaceWith(loserEl.clone().attr('id', id));
			}
			selectTab('#tab2');
			$.contest.panel.hide();
			this.poolEl.addClass('done');
			return;
		}
		if (this.currentRound == 'T0') {
			this.topBracket.unshift(winnerEl[0]);
			if (loserEl) this.bottomBracket.push(loserEl[0]);
		} else if (this.currentRound == 'E' || this.currentRound == 'W') {
			this.bottomBracket.push(winnerEl[0]);
			if (loserEl) {
				this.rip.unshift(loserEl.remove());
				this.numAlive--;
				this.standings.recordLoss(loserEl);
			}
		} else if (this.currentRound == 'T') {
			this.topBracket.push(winnerEl[0]);
			if (loserEl) this.winnowBracket.push(loserEl[0]);
		}
		updateTitle(winnerEl, true);
		if (loserEl) updateTitle(loserEl, false);
		$.contest.panel.hide();
		this.play();
	}
	
	this.orderChildren = function() {
		for (var child, i = 0; child = this.rip[i]; i++) {
			this.poolEl.append(this.rip[i]);
		}
		this.standings.print();
	}
}

/** The direct eliminations rounds. */
Stage2 = function(numLeaves, standings) {
	this.levels = this.getLevel(numLeaves) + 1;
	this.standings = standings;
}

Stage2.prototype = {
	play: function(slide) {
		var round = Math.pow(2, this.getLevel(slide.attr('id')));
		var title = round == 1 ? 'Finale' : 'Round of ' + round + 'ths.';
		$.contest.panel.show(slide.prev("div"), slide, title, $.contest.stage2);
	},
	
	saveResults: function(winnerEl, loserEl) {
		var id = winnerEl.attr('id');
		var winnerId = Math.floor(id/2);
		if (winnerId) {
			$(_id(winnerId)).replaceWith(winnerEl.clone().attr('id', winnerId));
			// this also copies the 'won' title...
		}			
		var loserId = id/2 == Math.floor(id/2) ? 1*id + 1 : id-1;
		updateTitle($(_id(id)), true);
		updateTitle($(_id(loserId)), false);
	
		$.contest.panel.hide();
		this.standings.recordStage2result(winnerEl, this.levels - this.getLevel(winnerId));
	},
	
	// total count or leave-id -> #rounds.
	getLevel: function(num) {
		return Math.floor(Math.log(num) / Math.log(2));
	},
};

/** The register of all players, with current standings. */
Standings = function(podium) {
	this.list = {};
	this.podium = podium;
	
	this.findRecord = function(element) {
		var name = $(element).find(".info").html();
		return this.list[hash(name)];
	}
	
	this.comparator = function(seq1, seq2) {
	  return seq2.count - seq1.count;
	}
}

Standings.prototype = {
	register: function(playerEl) {
		var name = $(playerEl).find(".info").html();
		var seq = this.list[hash(name)]
		if (!seq) {
			seq = [];
		  this.list[hash(name)] = seq;
		  seq.countWin = 0;
		  seq.total = 0;
		  seq.score = 0;
		  if (!seq.imgSrc) seq.imgSrc = $(playerEl).find('img').attr('src');
		}
		seq.push(name);
		seq.total++;
	},
	
	closeRegistration: function() {
		// find the 4 most popular ones and put them on the podium for now.
		var top4 = []; // keep sorted descending.
		for (var key in this.list) {
			var seq = this.list[key];
			if (top4.length < 4) {
			  top4.push(seq);
			} else if (seq.total > top4[3].total) {
				for (var i = 0; top4[i].total > seq.total; i++) {}
				top4.splice(i, 0, seq);
				top4.pop();
			}
		}
		for (var i = 0; i < 4; i++) {
			this.podium.bootstrap(top4[i].imgSrc);
		}
	},
	
	recordLoss: function(playerEl) {
		var name = playerEl.find(".info").html();
		for (var p, seq = this.list[hash(name)], i = 0; p = seq[i]; i++) {
			if (p == name) {
				seq.splice(i, 1);
				break;
			}
		}
	},
	
	recordWin: function(playerEl) {
		var seq = this.findRecord(playerEl);
		if (seq) { // because of placeholders.
			seq.countWin++;
			seq.score += 1;
		}
	},
	
	recordStage2result: function(winnerEl, level) {
		var seq = this.findRecord(winnerEl);
		seq.score += level;
		this.print();
	},
	
	print: function() {
	  //1. copy into a workable array and sort it.
	  var sorted = [];
	  for (var key in this.list) {
	  	var seq = this.list[key];
	  	var entry =  {};
	  	entry.name = key;
	  	entry.countWin = seq.countWin;
	  	entry.count = seq.length;
	  	entry.total = seq.total;
	  	entry.score = seq.score;
	  	sorted.push(entry)
	  }
	  sorted.sort(this.comparator);
	  
	  //2. print.
		var buf = "<table>";
		for (var entry, i = 0; entry = sorted[i]; i++) {
		  buf += "<tr><td>" + entry.name + "</td>";
		  buf += "<td><span class='green' style='width:" + (5 * entry.countWin) + "px'></span>";
		  	buf += "<span class='grey' style='width:" + (entry.count - entry.countWin) * 5 + "px'></span>";
		 		buf += "<span class='red' style='width:" + (entry.total - entry.count) * 5 + "px'></span></td>";
		  buf += "<td>" + entry.countWin + "/" + entry.count + "/" + entry.total + "</td>";
		  buf += "<td>Score: " + "<span class='green' style='width:" + (5 * entry.score) + "px'></span>" + entry.score + "</td>";
		  buf += "</tr>";
		}
		buf += "</table>";
		$('#standings > div').html(buf);
	},
};

Podium = function() {
	this.podium = [];
}

Podium.prototype = {
	bootstrap: function(src) {
		var next = this.podium.length + 1;
		if (next <= 4) {
			var nextPodium = $('#top' + next)
			this.podium.push(nextPodium);
			nextPodium.attr('src', src);
		}
	},
}

$(document).ready(function() {
	$.contest = {};
	$.contest.panel = new Panel('contest-panel');
	var poolDivs = $('#stage1 > div');
	$.contest.pool = {};
	$.contest.podium = new Podium();
	$.contest.standings = new Standings($.contest.podium);
	for(var div, p=0; div = poolDivs[p]; p++) {
		var id = 'pool-' + (p + 1);
		$.contest.pool[id] = new Stage1Pool(id, $.contest.standings);
	}
	$.contest.stage2 = new Stage2(poolDivs.length * 2, $.contest.standings);
	$.contest.standings.closeRegistration();
	$.contest.standings.print();
});

/* Global access to vote from the Panel. */
activate = function(event) {
	var target = $(event.target)
  if (target.parents("#contest-panel").length) {
		$.contest.panel.activate(event);
	} else if (target.parents("#stage1").length) {
		playStage1($(event.target).parents(".pool").prev("p"));
	} else if (target.hasClass('placeholder') && target.parents("#stage2").length) {
		selectTab('#tab1');
		var nextPool = $(".pool").not(".done")
		$('body').scrollTop(nextPool.position().top - 150)
	}
}

/* Opens the panel with the right candidates. */
play = function(event) {
	var slide = $(event.target).prev("div");
	$.contest.stage2.play(slide);
}

playStage1 = function(element) {
	if (!element.jquery) {
		element = $(element).parents("p");
	}
	var t = element.next("div");
	$.contest.pool[t.attr('id')].play();
}

/** My DOM specific stuff */
updateTitle = function(imgEl, won) {
	var style = won ? 'info won' : 'info lost';
	imgEl.find(".info").toggleClass('won', won).toggleClass('lost', !won);
}