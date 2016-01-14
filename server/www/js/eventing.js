/**
 * Event Handling
*/


events.on('ignoreCode', function(code){
	// send ignore's command to the Server 
	socket.emit('ignoreCode', code); // NB. socket defined below eventing.js
	RFcodes.deleteCode(code); // remove code from the incoming_codes.
});

events.on('removeIgnoreCode', function(code){
	// tells the server to switch the 'isIgnored' flag to false.
	socket.emit('removeIgnoreCode', code);
});

events.on('assignCode', function(code){
  var view = {title: 'Assign code', code: code};
  templating.renderTemplate('assignCode.mustache', $('#main_modal_box'), view).then(function(){
  	$('#assign-dialog').modal('show');
  }).catch(function(err){ // err
  	notie.alert(2, err, 0);
  });  
});


events.on('newCardClick', function(code){
	var view = {title: 'New Card', code: code};
	templating.renderTemplate('newCardForm.mustache', $('#main_modal_box'), view).then(function(){
		$('#new-card-dialog').modal('show');
		// all lower case, no blank space or non alpha numeric chars are admitted for this 2 fields
		$('#shortname, #roomname').keyup(function(){
		    this.value = this.value.replace(/\W+/g, " ");
    		this.value = this.value.replace(/\s+/g, '-').toLowerCase();
		});
		// dynamic form adapter
		$('#type').change(function() {
		    var str = '<label for="code" class="col-md-2 control-label">RF Codes</label>';
		    $('#type option:selected').each(function() {
		    	var selected = $(this).val();
		      if(selected === 'switch'){
		      	str += '<div class="col-md-5"><select id="code" name="on_code" class="form-control codes" required>'+RFcodes.getCodesInHTML()+'</select><span class="help-block">ON Code</span></div><div class="col-md-5"><select name="off_code" class="form-control codes" required>'+RFcodes.getCodesInHTML()+'</select><span class="help-block">OFF Code</span></div>';
		      }else if(selected === 'alarm'){
		      	str += '<div class="col-md-5"><select id="code" name="trigger_code" class="form-control codes" required>'+RFcodes.getCodesInHTML()+'</select><span class="help-block">Trigger Code</span></div>';
		      }else if (selected === 'info'){ // we don't need to have codes
		      	str = '';
		      }
		    });
		    $('#type_related_content').html(str);
		  }).change();
		// modal box incoming codes listener (to updated select box lists)
		function updateSelectBoxes(code){
			$('.codes').html(RFcodes.getCodesInHTML()).fadeIn(500);
		}
		RFcodes.on('newCode', updateSelectBoxes); // set listener
		RFcodes.on('removedCode', updateSelectBoxes); // set listener
		
		// remove listeners when modal gets closed
		$('#new-card-dialog').on('hidden.bs.modal', function (e) {
		  RFcodes.off('newCode', updateSelectBoxes);
		  RFcodes.off('removedCode', updateSelectBoxes);
		  console.log('modal box closed');
		  RFcodes.deleteCode(code);
		});
		// form submitting listener
		$('#newCardForm').submit(function(e){
			e.preventDefault();
			// TODO ajax POST to /api/card/new

			RFcodes.deleteCode(code); // remove code from the incoming codes. (in this way it can't be used anymore)
		});

	}).catch(function(err){ // err
		notie.alert(2, err, 0);
	}); 
});


events.on('renderSnackbar', function(_code){
	if (!RFcodes.incoming_codes.hasOwnProperty(_code)){ // code first time detected
		RFcodes.putCode(_code, {badge_count: 1}); // put the code in incoming_codes but using a method (in this way we can implement event handling)
		var mex = '<span class="pull-left" style="padding-top: 11px"><span class="badge">'+RFcodes.incoming_codes[_code].badge_count+'</span> Code detected: '+_code+'</span>'+
		'<span class="pull-right"><a href="#" class="btn btn-info btn-xs" onclick="events.emit(\'ignoreCode\', '+_code+');">Ignore</a>'+
		'<a href="#" class="btn btn-success btn-xs" onclick="events.emit(\'assignCode\', '+_code+');">Assign</a></span>';
		RFcodes.incoming_codes[_code].elem = $.snackbar({
			content: mex,
		 	timeout: 0,
		 	htmlAllowed: true,
		 	onClose: function(){ // when snackbar is closed
		 		// do nothing
			}}); // print snackbar

	}else{ // RFcode already exists and snackbar too, just increment badge_count field
		RFcodes.incoming_codes[_code].badge_count++;
		RFcodes.incoming_codes[_code].elem.find('.badge').fadeOut(500, function() {
        	$(this).html(RFcodes.incoming_codes[_code].badge_count).fadeIn(500);
    	});
	}
});

events.on('renderInitCards', function(initData){
	// TODO - stampare cards usando le iterazioni di Mustache! (come fatto per la tabella codici ignorati)
	console.log(initData);

	var _data = {};
	//temporaneo
	templating.renderTemplate('cards.mustache', $('#mainBody'), _data).then(function(){

		// NB. on dynamic refresh always recall these lines below
		$.material.init();
		if($('#cards_container').mixItUp('isLoaded')){ // if already loaded
			$('#cards_container').mixItUp('destroy');
			$('#cards_container').mixItUp({animation:{ animateResizeContainer: false}});
		}else
			$('#cards_container').mixItUp({animation:{ animateResizeContainer: false}});

	}).catch(function(err){ // err
  		notie.alert(2, err, 0);
  	});

});


// Menu Buttons


// Home Menu Button
events.on('clickHome', function(){
	console.log('Home button clicked.');
	socket.emit('getInitCards', socket.id);
	$('#c-circle-nav__toggle').click(); // Close Menu
});

// Ignored codes Menu Button
events.on('clickIgnoredCodes', function(){
	console.log('Ignored Codes button clicked.');
	$.get('/api/codes/ignored', function(data) {
		//var RFcodes = { RFcodes: JSON.parse(data) };

		var view = {title: 'Ignored RF codes', RFcodes: data};
		templating.renderTemplate('ignoredCodes.mustache', $('#main_modal_box'), view).then(function(){
			$('#ignored-codes-dialog').modal('show');
		}).catch(function(err){ // err
			notie.alert(2, err, 0);
		});
	});

	$('#c-circle-nav__toggle').click(); // Close Menu
});

// Timer Menu Button
events.on('clickTimer', function(){
	// TODO
	console.log('Timer button clicked.');
	$('#c-circle-nav__toggle').click(); // Close Menu
});

// Triggers Menu Button
events.on('clickTriggers', function(){
	// TODO (change with a plus button, to simply add a card from the Menu.)
	console.log('Triggers button clicked.');
	$('#c-circle-nav__toggle').click(); // Close Menu
});

// Settings Menu Button
events.on('clickSettings', function(){
	// TODO
	console.log('Settings button clicked.');
	$('#c-circle-nav__toggle').click(); // Close Menu
});