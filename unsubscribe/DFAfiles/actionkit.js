window.actionkit = { 'utils': {}, 'forms': {} };

// Keep console.log() from being an error
if ( !window.console ) window.console = { log: function() {} };
// Or country_change()
window.country_change = function() {};

(function(ak, utils, forms) {

var $ = window.jQuery;
// If we have multiple forms, just search within this form;
// otherwise search whole doc.
var $sel = function(selector) { 
    if ( ak.multiForms && ak.form ) 
        return $(ak.form).find(selector);
    return $(selector);
};
// Find by ID or (if we have multiple forms) class
var $id = function(id) { 
    if ( !ak.multiForms ) return document.getElementById(id);
    return $sel('#' + id + ', .' + id)[0]
};
var $log = function(item) { if (window.console) window.console.log(item); };

var $text = function(str) { return (forms.text && forms.text[str]) || '' };

// Accepts an error_name like 'card_num:invalid'
forms.errorMessage = function(error_name) { 
    var pieces = error_name.split(':');
    var field_name = pieces[0];
    var error_type = pieces[1];
    
    var field_name = forms.fixStateAndPostalFieldName(field_name)
    
    if ( ak.form['error_' + error_name] )
        return ak.form['error_' + error_name].value;

    if ( $text('error_' + error_name) ) 
        return $text('error_' + error_name);

    var formatString = $text('error_TEMPLATE:' + error_type);
    return utils.capitalize(
        utils.format(formatString, forms.fieldName(field_name))
    );
};

forms.isUnitedStates = function() {
    var country = ak.form && ak.form.country && utils.val(ak.form.country);
    return country == 'United States' || country == 'US' || !country;
}

// Call postal "ZIP Code" in the US and call zip "postal code" elsewhere
// (in error messages)
forms.fixStateAndPostalFieldName = function(field_name) {
    if (!/^(zip|postal|region|state)$/.test(field_name)) 
        return field_name;
    
    if ( forms.isUnitedStates() ) {
        if ( field_name == 'postal' ) return 'zip';
        if ( field_name == 'region' ) return 'state';
    }
    else {
        if ( field_name == 'zip' ) return 'postal';
        if ( field_name == 'state' ) return 'region';
    }
    
    return field_name;
}

forms.fieldName = function(field_name) {
    if ( ak.form['field_' + field_name] )
        return ak.form['field_' + field_name].value;

    if ( $text('field_' + field_name) ) 
        return $text('field_' + field_name);

    clean_name = field_name.replace(/^(user|action)_/, '');
    clean_name = clean_name.replace(/_/g, ' ').toLowerCase();
    return clean_name;
}

forms.contextRoot = '/context/';

/* Any form initialization we can do before we have context */
forms.beforeContextLoad = function() {
    if ( ak.args.event_id && ak.form.event_id )
        ak.form.event_id.value = ak.args.event_id;
    if ( ak.args.zip 
         && ak.form.template 
         && ak.form.template.value == 'event_search.html'
         && !ak.form.have_events ) {
        ak.form.zip.value = ak.args.zip;
        if ( ak.form.akid ) 
            ak.form.akid.value = ak.args.akid;
        actionkit.forms.eventSearch(ak.form);
    }
}

/* Ask for user info, congress #s, etc. ("context") via script tag */
forms.loadContext = function() {
    var contextArgs = {};
    
    forms.beforeContextLoad();
    
    contextArgs.callback = 'actionkit.forms.onContextLoaded';
    contextArgs.form_name = ak.form_name;
    if ( ak.args.action_id ) contextArgs.action_id = ak.args.action_id;
    if ( ak.args.akid ) contextArgs.akid = ak.args.akid;
    if ( ak.args.rd ) contextArgs.rd = ak.args.rd;
    if ( ak.args.ar ) contextArgs.ar = ak.args.ar;
    contextArgs.required = forms.required();
    if ( ak.form.want_progress ) contextArgs.want_progress = 1;
    if ( ak.form.template ) 
        contextArgs.template = ak.form.template.value;
    if ( ak.form.whipcount ) contextArgs.whipcount = ak.form.whipcount;
    if ( ak.args.want_prefill_data )
        contextArgs.want_prefill_data = 1;
    contextArgs.r = Math.random() // bust caching of response
    
    // Long URLs mess up MSIE and clutter up GET urls
    var url = '' + window.location;
    if ( url.length < 500 && ak.form.method != 'GET' ) 
        contextArgs.url = url;
    
    var root = forms.contextRoot;
    if ( !/\/$/.test(root) ) root += '/';
    
    var contextUrl = (root + ak.form.page.value + '?' + utils.makeQueryString(contextArgs));
    
    forms.createScriptElement(contextUrl);
};

forms.loadPrefiller = function() {
    var prefillerUrl = forms.contextRoot.replace('/context/', '/samples/prefill.js');
    forms.createScriptElement(prefillerUrl);
}

forms.loadProgress = function() {
    var progressUrl = forms.contextRoot.replace(
        '/context/', 
        '/progress/' + ak.form.page.value + '?form_name=' + ak.form_name + '&callback=actionkit.forms.onProgressLoaded'
    );
    forms.createScriptElement(progressUrl);
}

forms.onProgressLoaded = function(progress) {
    if ( progress.form_name )
        forms.setForm(progress.form_name);
    ak.context.progress = progress;
    // This may be a jQuery bug: I have to manually filter for htmlFor ==
    // 'progress'
    var templates = $sel("script[type='text/ak-template']");
    for ( var i  = 0; i < templates.length; ++i )
        if ( utils.getAttr(templates[i], 'for') == 'progress' )
            forms.doTemplate(ak.context, templates[i]);
}

forms.onPrefillerLoaded = function() {
    if ( ak.forms.awaitingPrefill ) forms.prefill();
}

forms.prefill = function(overwrite) {
    var prefill_data = ( 
        ( ak.context && ak.context.prefill_data ) 
        ? ak.context.prefill_data 
        : ak.args
    );
    if ( prefill_data.form_name ) 
        forms.setForm(prefill_data.form_name);
    $(ak.form).deserialize(prefill_data, {overwrite: false});
    
    // Check/uncheck boxes, which deserialize() won't do
    $(ak.form).find('input:checkbox').each(function() {
        this.checked = prefill_data[this.name] ? true : false;
    })

    // checking for true, not just present
    if ( prefill_data['amount_other'] )
        $(ak.form).find('input.amount_radio_button').attr('checked', false)
}

forms.loadText = function() {
    if ( ak.textLoading ) return;
    var relative_url = '/text/' + ak.context.lang_id + '?callback=actionkit.forms.onTextLoaded&rand_id=' + Math.random();
    var textUrl = forms.contextRoot.replace('/context/', relative_url);
    ak.textLoading = 1;
    forms.createScriptElement(textUrl);
}

forms.onTextLoaded = function(text) {
    forms.text = text;
}

forms.createScriptElement = function(url, attrs) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    if ( attrs )
        for ( name in attrs )
            if ( attrs.hasOwnProperty(name) )
                $(script).attr(name, attrs[name]);
    document.getElementsByTagName('head')[0].appendChild(script);
    script.src = url;
}

// Used by admin.  Give an anonymous callback a name, make a
// call for JSON like the /context and /text calls
var max_callback_id = 0;
forms.loadJSON = function(url, args, fn, err) {
    var callback_id = ++max_callback_id;
    var callback_name = 'actionkitCallback' + callback_id;
    window[callback_name] = fn;
    var err_callback_name = 'actionkitError' + callback_id;
    if(err) window[err_callback_name] = err;
    if (!args) args = {};
    args.callback = 'window.' + callback_name;
    url_with_args = url + '?' + utils.makeQueryString(args);
    forms.createScriptElement(
        url_with_args, 
        err ? {onerror: err_callback_name + '()'} : {}
    );
};

forms.handleQueryStringErrors = function() {
    // Load up errors from the query string into ak.errors and display them
    var errors = {}
    if ( ak.args.form_name )
        forms.setForm( ak.args.form_name );
    
    // Deal with forms in initially-hidden fieldsets on event pages
    // But don't crash if there's no form
    if ( ak.form ) {
        $(ak.form).show();
        $(ak.form).closest('fieldset').show();
    }

    // This can be called before page is loaded, e.g., while init'ing a 
    // signup form in the top toolbar.  If that happens, the form we're 
    // looking for won't exist yet.  If that happens, bail quietly.
    var cur_form_name = ak.form && utils.getAttr(ak.form, 'name');
    if ( ak.args.form_name 
         && (!ak.form || ak.args.form_name != cur_form_name) ) return;
    
    for (key in actionkit.args) {
        match = /^(error|message)_(.*)/.exec(key)
        if ( !match ) continue;
        error_name = match[2];
        error_html = ak.args[key];

        // Don't insert HTML tags from ak.args because that'd allow XSS.  
        if ( /</.test(error_html) ) {
            // To not break existing custom error msgs with links, try to
            // get the error message from a hidden field if it's stored
            // there.
            var error_from_page = 
                forms.errorMessage(error_name);
            if ( error_from_page ) {
                error_html = error_from_page;
            }
            // Failing that, strip the HTML out of the error from the args.
            else {
                error_html = error_html.replace(/<.*?>/g, '');
                error_html = error_html.replace(/</g, '');
            }
        }

        errors[error_name] = error_html;
    }
    if ( utils.hasAnyProperties(errors) ) {
        ak.errors = errors;
        ak.forms.onValidationErrors(errors);
    }
}

/* Set akid, source, etc. in form, do "Not Bob?" if needed */
forms.onContextLoaded = function(context) {
    if ( context.form_name )
        forms.setForm(context.form_name);
    
    if ( ak.context ) return;
    
    var start = (new Date()).getTime()
    
    ak.context = context;
    
    // ak.args.nr == no recognition, force AK not to recognize the user if
    // nr = 1 in the query string.
    var recognize = ak.context.recognized_user = ( 
        context.name
        && !context.missing_user_fields 
        && !context.incomplete
        && !ak.args.nr
    );

    var referring_akid = ak.args.referring_akid;

    if ( recognize ) {
        utils.appendHiddenInput('akid', ak.args.akid);
        $sel('#known_user_name, .known_user_name').text(context.name);
        // remove() to remove any fields that browsers may autofill
        $sel('#unknown_user, .unknown_user').hide().find('select, input[type=text]').remove();
        $sel('#known_user, .known_user').show();
        if ( ak.args.action_id )
            $sel('#ak-logout, .ak-logout').hide();
    }
    else {
        if ( ak.args.akid ) 
            referring_akid = ak.args.akid;
        $sel('#unknown_user, .unknown_user').show();
        $sel('#known_user, .known_user').hide();
    }

    ak.form.style.display = 'block';

    if ( referring_akid )
        utils.appendHiddenInput('referring_akid', referring_akid);

    if ( ak.args.source )
        utils.appendHiddenInput('source', ak.args.source);
    if ( ak.args.action_id 
         && !(ak.form.action_id && ak.form.action_id.value) )
        utils.appendHiddenInput('action_id', ak.args.action_id);
    if ( ak.args.update )
        utils.appendHiddenInput('update', ak.args.update);

    utils.appendHiddenInput('form_name', ak.form_name);
    utils.appendHiddenInput('url', window.location);
    
    utils.appendHiddenInput('js', 1);
    
    if ( context.required )
        for ( var i = 0; i < context.required.length; ++i )
            utils.appendHiddenInput('required', context.required[i]);
    
    if ( context.incomplete )
        utils.appendHiddenInput('status', 'incomplete');
    
    if ( context.targets )
        forms.onTargets();
    
    context.args = ak.args;
    context.capitalize = ak.utils.capitalize;
    context.add_commas = ak.utils.add_commas;

    if ( ak.form.want_progress && !context.progress )
        forms.loadProgress();

    // For old templates, avoid an error when context.progress is 
    // missing
    if ( !context.progress ) context.progress = {
        'goal': undefined,
        'total': undefined
    };

    var templates = $sel("script[type='text/ak-template']");
    for ( var i = 0; i < templates.length; ++i )
        forms.doTemplate(context, templates[i]);

    if ( typeof($.fn.deserialize) == 'function' )
        actionkit.forms.prefill();
    else
        actionkit.forms.awaitingPrefill = 1;

    if ( window.startTime )
        $log(((new Date()).getTime() - window.startTime) + 'ms');

    forms.loadText();

    forms.handleQueryStringErrors();
};

forms.doTemplate = function(context, elem) {
    var forElem = utils.getAttr(elem, 'for');
    try {
        var html = utils.template(elem.innerHTML, context);
        $id(forElem).innerHTML = html;
    }
    catch(e) {
        // Should this complain more loudly?
        $log('Template exception (id: ' + forElem + ')');
        $log(e);
    }
};

forms.onTargets = function() {
    var targets = ak.context.targets;

    targets.pl = function(singular, plural) { 
        return targets.plural ? plural : singular;
    }
    targets.s = targets.pl('', 's');
    targets.es = targets.pl('', 'es');

    var target_form = $id('target_checkboxes');
    $log(targets.checkboxes_html)
    if (target_form && targets.checkboxes_html) 
        target_form.innerHTML = targets.checkboxes_html;
    
    var target_listing = $id('target_listing');
    if (target_listing && targets.listing_html) 
        target_listing.innerHTML = targets.listing_html;
};

forms.eventSearch = function(form, args) {
    var qs, page;
    if ( form ) {
        if ( form.url ) form.url.value='';
        qs = $(form).serialize();
        page = form.page.value;
    }
    else {
        qs = utils.makeQueryString(args);
        page = args.page;
    }
    qs += ('&callback=actionkit.forms.onEventSearchResults'
           + '&r=' + Math.random());
    var search_root = actionkit.forms.contextRoot.replace(
        '/context/',
        '/cms/event/' + page + '/search_results/?'
    );
    actionkit.forms.createScriptElement(search_root + qs);
    return false;
}

forms.onEventSearchResults = function(html) {
    $sel('#event-search-results, .event-search-results').html(html);
}
    
forms.logOut = function() {
    var args = ak.args;
    args['referring_akid'] = args['akid'];
    delete args['akid'];
    if (!args['referring_akid']) {
        // If there's no akid, log user out w/ /logout
        var next = window.location.pathname + '?' + utils.makeQueryString(args);
        window.location.href = '/logout/?next=' + utils.escapeForQueryString(next); 
    }
    else {
        // Rest of the time, just remove akid arg
        window.location.search = '?' + utils.makeQueryString(args);
    }
    return false;
};

var validators = {};

validators.email = function() {
    if ( !/^\s*\S+@\S+\.\S+\s*$/.test(this.value) )
        return forms.errorMessage(this.name + ':invalid');
    return true;
};

validators.taf_emails = function() {
    if ( !/\w\S+@\S+\.\w+/.test(this.value) )
        return forms.errorMessage(this.name + ':missing')
    return true;
};

validators.zip = function() {
    if ( ak.form.country && utils.val(ak.form.country) != 'United States' ) 
        return true;
    if ( !/\d{5}/.test(this.value) )
        return forms.errorMessage('zip:invalid')
    return true;
};

validators.postal = validators.zip;

validators.phone = function() {
    if ( ak.form.country && utils.val(ak.form.country) != 'United States' ) 
        return true;
    if ( !/^.*\d{3}.*\d{3}.*\d{4}.*/.test(this.value) ) 
        return forms.errorMessage(this.name + ':invalid');
    return true;
};

validators.mobile_phone = 
    validators.home_phone = 
    validators.work_phone = 
    validators.emergency_phone = 
        validators.phone;

validators.event_max_attendees = function() {
    if (!/^\d*$/.test(this.value))
        return(forms.errorMessage(this.name + ':invalid'));
    return true;
}

// Will need love for international dates/times
forms.dateFormat = 'mm/dd/yy';
forms.dateRegexp = /^[01]?\d\/[0-3]?\d\/\d\d\d\d$/;

validators.date = function() {
    // Regexp catches some invalid dates datepicker does not
    var valid = !!forms.dateRegexp.test(this.value);
    // If jQuery datepicker is available, do extra validation
    if ( valid && $.datepicker ) {
        try { 
            $.datepicker.parseDate(forms.dateFormat, this.value)
        }
        catch (e) {
            valid = false;
        }
    }
    if ( valid ) return true;
    else return forms.errorMessage(this.name + ':invalid');
}

forms.timeRegexp = /^[01]?\d(:[0-5]\d)?$/;

validators.time = function() {
    if (forms.timeRegexp.test(this.value)) return true;
    else return forms.errorMessage(this.name + ':invalid');
}

forms.defaultValidators = validators;

forms.required = function() {
    var required = [];
    
    // E-mail and country are always required, unless the form doesn't have
    // them
    if ( !ak.form ) {
        required = ['email', 'country'];
    }
    else {
        if ( ak.form.email ) required.push('email');
        if ( ak.form.country ) required.push('country');
    }

    var required_inputs = 
        ak.form.elements.required ? utils.list(ak.form.elements.required) : [];
    for ( var i = 0; i < required_inputs.length; ++i )
        required.push(required_inputs[i].value);
    
    // Make ZIP/postal and state/region interchangeable
    required = forms.fixStateAndZipRequirement(required);
    
    return required;
};

forms.fixStateAndZipRequirement = function(required) {
    for (var i = 0; i < required.length; ++i) {
        if ( required[i] == 'zip' && !ak.form.zip )
            required[i] = 'postal';
        if ( required[i] == 'postal' && !ak.form.postal )
            required[i] = 'zip';
        if ( required[i] == 'state' && !ak.form.state )
            required[i] = 'region';
        if ( required[i] == 'region' && !ak.form.region )
            required[i] = 'state';
    }
    // We can't require region and postcode everywhere, so don't
    if ( !forms.isUnitedStates() ) {
        required = $.grep(required, function(field_name) {
            return !/^(zip|postal|state|region)$/.test(field_name)
        });
    }
    return required;
}

forms.validate = function() {
    var errors = {};
    var required = forms.required();
    
    // If we're missing translation data we can't display errors anyway, so just 
    // let the server check
    if ( !forms.text ) return true;
    
    // If form has an onvalidate attribute, use it  
    var formValidator = utils.getAttr(ak.form, 'onvalidate');
    if ( formValidator ) {
        ak.errors = errors;
        var compiled = utils.compile(formValidator);
        console.log(formValidator);
        console.log(compiled);
        compiled.apply(ak.form, []);
        errors = ak.errors;
    }
    
    // Filter out user fields if appropriate
    if ( ak.form.akid ) {
        var userFieldSet =
            utils.makeSet(['email', 'prefix', 'first_name', 'middle_name', 
                   'last_name', 'suffix', 'name', 'address1', 'address2',
                   'city', 'state', 'zip', 'postal', 'country', 'region',
                   'phone', 'home_phone', 'work_phone', 'mobile_phone']);
        for ( var i = 0; i < required.length; ++i )
            if ( /^user_/.test(required[i]) || 
                 userFieldSet[required[i]] )
                delete required[i];
    }
    
    // Check they're nonblank
    for ( var i = 0; i < required.length; ++i ) {
        if ( typeof(required[i]) == 'undefined' ) continue;

        // Special case: first_name/last_name required but there's only a
        // "name" field
        if ( /^(first|last)_name$/.test(required[i]) 
             && !ak.form[required[i]] ) {
            // Error if only one name was given
            if ( !ak.form.name || !/\S\s\S/.test(ak.form.name.value) )
                errors['name:first_and_last'] = 
                    forms.errorMessage('name:first_and_last')
            continue;
        }

        if ( required[i] === 'name' && !(ak.form.name && ak.form.name.value)) {
            if (ak.form.first_name && ak.form.first_name.value &&
                ak.form.last_name && ak.form.last_name.value) 
                continue;
       }
        
        if ( !ak.form[required[i]] || !utils.val(ak.form[required[i]]) 
             || (/checkbox/i.test(ak.form[required[i]]).type && 
                 !ak.form[required[i]].checked) )
            errors[required[i] + ':missing'] = 
                forms.errorMessage(required[i] + ':missing')
    }
    
    // Check validity with onvalidate
    elements = ak.form.elements;
    var required_set = utils.makeSet(required);
    for ( var i = 0; i < elements.length; ++i ) {
            var elem = elements[i];
            var val = utils.val(elem);
            if ( !val && !required[elem.name] ) continue;
            // Temporarily patch up expiration dates on the client
            // Try to tolerate 0211, 02/11, 2/11, 2/2011, 2/20, 022001, 22001
            if ( elem.name == 'exp_date' ) {
                val = val.replace(/\D/g, '');
                val = val.replace(/^(\d?\d)20(\d\d)$/, '$1$2');
                if ( val.length == 3 ) val = '0' + val;
                elem.value = val;
            }
            var validator = utils.getAttr(elem, 'onvalidate');
            if (!validator && utils.getAttr(elem, 'format')) 
                validator = 
                    forms.defaultValidators[
                        utils.getAttr(elem, 'format')
                    ];

            if (!validator) 
                validator = forms.defaultValidators[elem.name];
            compiled = validator && utils.compile(validator);
            if ( !compiled ) continue;
            err = compiled.apply(elem, []);
            // Validator may return false or a string error msg
            if ( typeof(err) == 'string' || !err ) {
                errors[elem.name + ':invalid'] = 
                    typeof(err) == 'string' 
                        ? err 
                        : forms.errorMessage(required[i] + ':invalid');
            }
    }
    
    if (utils.hasAnyProperties(errors)) {
        ak.errors = errors;
        ak.forms.onValidationErrors(errors);
        return false;
    }
    ak.errors = undefined;
    forms.clearErrors();
    
    // Let forms have a confirm popup that only runs if validation passes
    var onconfirm = utils.getAttr(ak.form, 'onconfirm');
    if ( onconfirm )
        return utils.compile(onconfirm).apply(ak.form);
    
    return true;
};

forms.clearErrors = function() {
    ak.errors = undefined;
    if ( ak.form )
        ak.form.className = 
            ak.form.className.replace('contains-errors', '');
    var error_list = $id('ak-errors');
    if ( error_list ) {
        error_list.innerHTML = '';
        error_list.style.display = 'none';
    }
    var message_list = forms.findConfirmationBox();
    if ( message_list ) {
        message_list.innerHTML = '';
        message_list.style.display = 'none';
    }
    $sel(':input.ak-error, label.ak-error').removeClass('ak-error');
    $sel('.ak-error-row').removeClass('ak-error-row');
    // also delete in-line errors
    $('.ak-error').remove();

};

// Would be nice: Sort errors based on the order of the controls 
// in the HTML
// 
// Would be nice: Allow more than one ak-errors <ul>, so errors
// can appear above each section of a long form (event creation)
forms.onValidationErrors = function(errors) {
    if (ak.errors) forms.clearErrors();

    // Mark the controls bad
    var error_list = $id('ak-errors');
    var message_list = forms.findConfirmationBox();
    for ( error in errors ) {
        if ( !errors.hasOwnProperty(error) ) continue;
        var li = document.createElement('li');
        li.innerHTML = errors[error];
        var list = (
            /success/.test(error) 
            ? (message_list || error_list) 
            : error_list
        );
        if ( list ) {
            $(list).show();
            list.appendChild(li);
        }
        error = error.split(':')[0];
        if (ak.form && ak.form[error]) {
            $(ak.form[error]).addClass('ak-error');
        } 

        var containing_row = $id('id_' + error + '_row');
        if (containing_row) 
            $(containing_row).className += ' ak-error-row'
    }

    // Mark the labels, too
    var labels = ak.form ? ak.form.getElementsByTagName('label') : [];
    for ( var i = 0; i < labels.length; ++i ) {
        var label = labels[i];
        var label_target = label.htmlFor && $id(label.htmlFor);
        if ( !label_target ) continue;
        if ( /\berror\b/.test( label_target.className ) )
            label.className += ' ak-error';
    }
    
    // Scroll up so errors are visible
    window.scrollTo(0,0);
    
    // Mark the form
    if ( ak.form )
        ak.form.className += ' contains-errors';
};

forms.timeout = 3000; // After 3 seconds, assume script tag isn't coming

forms.onTimeout = function() {
    forms.onContextLoaded({});
};

forms.initPage = function() {
    ak.args = utils.getArgs();
    document.body.className += ' js';  // hides form
    // Disable funky back/forward caching
    if ( !window.onload ) window.onload = function() {};
    // Firebug Lite on IE if asked for
    if ( $.browser.msie && ak.args.debug ) {
        window.firebug = { env: {openInPopup: true, debug: true } };
        document.write("<script type='text/javascript' src='http://getfirebug.com/releases/lite/1.2/firebug-lite-compressed.js'></scr" + "ipt>");
    }
};

forms.tryToValidate = function() {
    if ( ak.DEBUG ) {
        try {
            return forms.validate(); 
        }
        catch (e) {
            $log(e);
            return false;
        }
    }
    else {
        return forms.validate();
    }
}

forms.formData = {};

forms.setForm = function(form) {
    if (form == 'undefined' || !form) {
        $log('No form passed to set_form');
        return;
    }

    // Check if we're really switching forms
    var cur_form_name = ak.form && utils.getAttr(ak.form, 'name');
    var new_form_name = ak.form_name = (
        typeof form == 'string' ? form : utils.getAttr(form, "name")
    );
    if ( cur_form_name == new_form_name ) return;

    // Switch on new $sel behavior iff there are 2+ forms
    if ( cur_form_name && new_form_name ) ak.multiForms = true;
    
    // Stash current context/errors/whatever
    if ( cur_form_name )
        forms.formData[cur_form_name] = {
            context: ak.context,
            errors: ak.errors
        };
    
    // Get new form
    //
    // need to do this the hard way since getElementsByName will get
    // fooled in IE into picking up the <div id='taf'>
    ak.form = undefined;
    var all_forms = document.getElementsByTagName('form');
    for(var i=0; i<all_forms.length; i++) {	 
        if(utils.getAttr(all_forms[i], "name") == new_form_name) {
           ak.form = all_forms[i];
           break;
        }
    }
    var stashed = forms.formData[new_form_name] || {};

    // And get context/errors corresponding to the other form
    ak.context = stashed.context;
    ak.errors = stashed.errors;
}

// Set a validation hook, request context
// Note initTafForm/initValidation (same thing) are used
// for forms that don't need context
forms.initForm = function(form_name) {
    forms.setForm(form_name);
    window.setTimeout(forms.onTimeout, 5000);
    if ( !ak.form.onsubmit ) 
        ak.form.onsubmit = function() {
            forms.setForm(form_name);
            var result = forms.tryToValidate();
            return result;
        }
    if ( ak.args.prefill || ak.args.want_prefill_data )
        forms.loadPrefiller();
    forms.loadContext();
};

// Find .ak-confirmation or .[form-name]-confirmation
// Gotcha: box can be outside the <form>, 'cause sometimes we want the
// message on *top* of a page with many forms (event host page) or no
// form ("your event is cancelled" page) 
forms.findConfirmationBox = function() {
    // Form-specific confirmation, in or out of form
    var confirmation_box = $('#' + ak.form_name + '-confirmation')[0];
    // ak-confirmation in the form
    if ( !confirmation_box )
        confirmation_box = $id('ak-confirmation');
    return confirmation_box;
}

// Set validation hook, insert akid/action_id, but don't
// request context.  Used for TAF forms and other forms 
// that just want validation, not recognizing user etc.
forms.initValidation = function(form_name, context) {
    forms.setForm(form_name)
    
    // Just show errors/confirmations if there's no form
    if ( !ak.form )
        return forms.handleQueryStringErrors();
    
    if ( ak.args.akid )
        utils.appendHiddenInput('akid', ak.args.akid);
    if ( ak.args.action_id 
         && !(ak.form.action_id && ak.form.action_id.value) )
        utils.appendHiddenInput('action_id', ak.args.action_id);
    if ( !ak.form.onsubmit ) 
        ak.form.onsubmit = function() {
            forms.setForm(form_name);
            return forms.tryToValidate();
        }
    // Unhide confirmation if this might be TAF success
    if ( ak.args.did_taf 
        && forms.findConfirmationBox()
        && ((!ak.form_name) || ak.form_name == ak.args.form_name)) {
        $(forms.findConfirmationBox()).show();
    }
    if ( ak.args.prefill || ak.args.want_prefill_data )
        forms.loadPrefiller();
    forms.onContextLoaded(context || {})
}

// Other forms besides TAF can use the "lite" setup
forms.initTafForm = forms.initValidation;




utils.getById = $id;

utils.escapeForQueryString = function(str) { 
    esc = escape;
    if ( typeof(encodeURIComponent) != 'undefined' )
        esc = encodeURIComponent;
    return esc(str).replace(/\+/g, '%2B'); 
};

utils.makeQueryString = function(args) {
    if (!args) return '';
    var encoded = [];
    for ( key in args ) {
        if ( !args.hasOwnProperty(key) ) continue;
        var item = args[key];
        if ( typeof(item) == 'object' ) {
            for ( var i = 0; i < item.length; ++i )
                encoded.push(key + '=' + 
                    utils.escapeForQueryString(item[i]));
        }
        else { 
            encoded.push(key + '=' + 
                utils.escapeForQueryString(item));
        }
    }
    return encoded.join('&');
};

utils.getArgs = function() {
    var argsStr = window.location.search;
    var pairs = argsStr.replace(/^\?/, '').split('&');
    var args = {};
    unesc = unescape;
    if ( typeof(decodeURIComponent) != 'undefined' )
        unesc = decodeURIComponent;
    for ( var i = 0; i < pairs.length; ++i ) {
        pair = pairs[i].split('=');
        if (pair[0]) {
            if (pair[1])
               pair[1] = unesc(pair[1].replace(/\+/g, ' '));
            args[unesc(pair[0].replace(/\+/g, ' '))] = pair[1];
        }
    }
    return args;
} 

utils.div = document.createElement('div');

utils.makeHiddenInput = function(name, value) {
    // InnerHTML trick is needed to make MSIE work
    utils.div.innerHTML = '<input type="hidden" name="' + name + '" />';
    var input = utils.div.firstChild;
    input.value = value;
    return input;
};
    
utils.appendHiddenInput = function(name, value) {
    if (typeof(ak) != 'undefined' && typeof(ak.form) != 'undefined') {
        ak.form.appendChild(utils.makeHiddenInput(name, value))
    }
};
    
utils.makeSet = function(list) { 
    var s = {}; 
    for ( var i = 0; i < list.length; ++i ) 
        if ( typeof(list[i]) != 'undefined' )
            s[list[i]] = 1;
    return s;
}
    
utils.getAttr = function(element, attribute) {
    return ( element.attributes && element.attributes[attribute] )
        ? element.attributes[attribute].nodeValue
        : element[attribute];  // for Safari
}

utils.hasAnyProperties = function(o) {
    for ( property in o )
        if ( o.hasOwnProperty(property) )
            return true;
    return false;
}

utils.list = function(i) {
    if (typeof(i[0]) == "undefined")
        return [i];
    else return i;
}

utils.val = function(e) {
    if ( e.tagName && e.tagName.toLowerCase && 
            e.tagName.toLowerCase() == 'select' ) {
        return $(e).val();
    } else if (e[0] && e[0].type == "radio") {
        return $(e).filter(":checked").val();
    } else {
        return e.value;
    }
}

utils.compile = function(code, paramlist) {
    // "false ||" works around MSIE behavior
    if ( typeof(code) == 'function' ) return code;
    if ( !paramlist ) paramlist='';
    return eval('false || function(' + paramlist + '){' + code + '}');
}

utils.capitalize = function(str) {
    return str.replace(/^(.)/, function(m) {return m.toUpperCase()} )
}

utils.add_commas = function(str, comma) {
    str = '' + str;
    if (!comma) comma = ',';
    while (/^([^\.\,]*\d)(\d{3})/.test(str))
        str = str.replace(/^([^\.\,]*\d)(\d{3})/, 
                          function(all, left, right) { 
                              return left + comma + right 
                          })
    return str;
}

// Simple printf-like '{0} is required', not to be confused with
// templating below
utils.format = function(str) {
    var format_args = arguments;
    var auto_number = 0;
    var arg_replacement = function(all, number) {
        // The lazy can say "{} is {}" instead of "{0} is {1}"
        if (number === '') number = auto_number++;
        return format_args[parseInt(number)+1]
    };
    return str.replace(/\{(\d*)\}/g, arg_replacement);
}

// Tweaked for ActionKit to use a more WYSIWYG-friendly syntax: 
// [%...%]
// And applied fix for single quotes from 
// http://plugins.jquery.com/node/3694
utils.template = 
// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
(function(){
  var cache = {};
  
  this.tmpl = function (str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] ||
        tmpl(document.getElementById(str).innerHTML) :
      
      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +
        
        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +
        
        // Convert the template into pure JavaScript
        str
          .replace(/[\r\t\n]/g, " ")
          .split("\[%").join("\t")
          .replace(/(^|%\])[^\t]*/g, function(text){return text.replace(/['\\]/g, "\\$&")})
          .replace(/\t=(.*?)%\]/g, "',$1,'")
          .split("\t").join("');")
          .split("%\]").join("p.push('")
      + "');}return p.join('');");
    
    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
  
  return this.tmpl;
})();

})(window.actionkit, window.actionkit.utils, window.actionkit.forms);
