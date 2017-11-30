/*
 *  Swyft Callback - v0.0.1
 *  A dynamic callback contact form
 *
 *  Made by Adam Kocić (Falkan3)
 *  Under MIT License
 */
// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ($, window, document, undefined) {

    "use strict";

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "swyftCallback",
        form_obj_prefix = 'sc_',
        form_fields_prefix = 'sc_fld_',
        input_all_mask = 'input, select, textarea',

        defaults = {
            api_url: "test",
            form_method: "post",
            //data
            custom_button_class: "",
            custom_button_data: "",
            custom_popup_class: "",
            custom_popup_data: "",
            //status
            status: {
                popup_hidden: true,
                button_disabled: false, //disable show/close functionality
                ajax_processing: false,
            },
            //content - text
            text_vars: {
                popup_title: "Contact form",
                popup_body: "Leave us your phone number. We'll call you back.",
                send_button_text: "Send",
            },
            //form info
            novalidate: true,
            input: {
                prefix: form_fields_prefix,
                fields: [
                    {
                        obj: null,
                        name: 'phone',
                        field_name: form_fields_prefix + 'telephone',
                        label: 'Phone number',
                        type: 'tel',
                        placeholder: '000-000-000',
                        max_length: 20,
                        required: true
                    },
                ],
                agreements: [
                    {
                        short: 'Lorem',
                        long: 'Ipsum',
                        readmore: 'More'
                    }
                ]
            },
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        //set default vars for the fields in form
        this.setDefaultVars();

        //dynamic vars
        //button used to bring up popup window
        this.button = {
            obj: null
        };
        //popup window
        this.popup = {
            obj: null, form: null
        };

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        //if(jQuery.fn.pluginName) {...} - check for functions from other plugins (dependencies)

        init: function () {

            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.settings
            // you can add more functions like the one below and
            // call them like the example bellow
            this.initPopup();
            this.initButton();
        },
        setDefaultVars: function() {
            //set default vars for form fields
            var template = defaults.input.fields[0];
            for(var i = 0; i< this.settings.input.fields.length; i++) {
                this.settings.input.fields[i] = $.extend({}, template, this.settings.input.fields[i]);
            }
        },
        formatClasses: function(input) {
            var _input = input;
            var input_length = _input.length;
            var output = '';
            if (input) {
                output += ' ';

                //is array
                if (input.constructor === Array) {
                    for (var i = 0; i < input_length; i++) {
                        output += _input[i] + ' ';
                    }
                    if (output[output.length - 1] == ' ') {
                        output = output.slice(0, -1);
                    }
                } else {
                    output += _input;
                }
            }

            return output;
        },

        initButton: function () {
            var objThis = this;
            var classes = this.formatClasses(this.settings.custom_button_class);
            var data = this.formatData(this.settings.custom_button_data);
            var $buttonBody = $(
                '<div class="' + form_obj_prefix + 'tg_btn' + classes + '" ' + data + '>\n' +
                '    <div class="' + form_obj_prefix + 'round_container">\n' +
                '        <div class="' + form_obj_prefix + 'icon">' +
                '           <a href="#"></a>\n' +
                '        </div>\n' +
                '    </div>\n' +
                '</div>');
            this.button.obj = $buttonBody.appendTo($(this.element));

            this.button.obj.find('a').on('click', function (e) {
                e.preventDefault();

                objThis.TogglePopup();
            });
        },

        /*
         * Builders for popup body
         */
        initPopup_generate_fields: function() {
            //form fields
            var fields = '';
            var dynamic_attributes = [];

            for (var i = 0; i < this.settings.input.fields.length; i++) {
                var field = this.settings.input.fields[i];

                // generate attributes for popup body
                dynamic_attributes = [
                    //0
                    {
                        name: 'input',
                        attributes: [
                            {key: 'id', value: field.field_name},
                            {key: 'name', value: field.field_name},
                            {key: 'type', value: field.type},
                            {key: 'placeholder', value: field.placeholder},
                            {key: 'value', value: field.value},
                            {key: 'maxlength', value: field.max_length},
                            {key: 'required', value: field.required},
                        ],
                        formatted: ''
                    },
                ];
                dynamic_attributes = this.formatDynamicAttributes(dynamic_attributes);

                var output = '<div class="' + form_obj_prefix + 'division">\n' +
                    '               <div class="input">\n' +
                    '                   <label for="' + form_fields_prefix + 'telephone">' + field.label + '</label>\n' +
                    '                   <input ' + dynamic_attributes[0].formatted + '/>\n' +
                    '               </div>\n' +
                    '             </div>\n';
                fields += output;
            }

            return fields;
        },
        initPopup_generate_popup_agreements: function() {
            var agreements = '';
            for (var i = 0; i < this.settings.input.agreements.length; i++) {
                var agreement = this.settings.input.agreements[i];
                var output = '<div class="' + form_obj_prefix + 'division">\n' +
                    '                   <div class="' + form_obj_prefix + 'checkbox_container">\n' +
                    '                       <input id="' + form_fields_prefix + 'agreement_' + i + '" type="checkbox" checked="checked" />\n' +
                    '                       <span class="checkmark"></span>\n' +
                    '                   </div>\n' +
                    '\n' +
                    '                   <label for="' + form_fields_prefix + 'agreement_' + i + '">' + agreement.short + ' <span class="' + form_obj_prefix + 'readmore">' + agreement.readmore + ' </span></label>\n' +
                    '                   <span class="' + form_obj_prefix + 'readmore_body" style="display: none;">\n' +
                    '                       ' + agreement.long +
                    '                   </span>\n' +
                    '             </div>';
                agreements += output;
            }

            return agreements;
        },
        initPopup_generate_popup_body: function(fields, agreements) {
            var dynamic_attributes = [];

            // generate attributes for popup body
            var classes = this.formatClasses(this.settings.custom_popup_class);
            dynamic_attributes = [
                //0
                {
                    name: 'form',
                    attributes: [
                        {key: 'action', value: this.settings.api_url},
                        {key: 'method', value: this.settings.form_method},
                        {key: 'novalidate', value: this.settings.novalidate},
                    ],
                    formatted: ''
                },
            ];
            dynamic_attributes = this.formatDynamicAttributes(dynamic_attributes);

            var $popupBody = '<div class="' + form_obj_prefix + 'overlay" style="display: none;">\n' +
                '    <div class="' + form_obj_prefix + 'popup' + classes + '">\n' +
                '        <div class="' + form_obj_prefix + 'btn_close"></div>\n' +
                '        <div class="' + form_obj_prefix + 'title_section">\n' +
                '            <p>' + this.settings.text_vars.popup_title + '</p>\n' +
                '        </div>\n' +
                '\n' +
                '        <div class="' + form_obj_prefix + 'body_section">\n' +
                '            <form ' + dynamic_attributes[0].formatted + '>\n' +
                '                <div class="container-fluid">\n' +
                '                    <div class="row">\n' +
                '                        <div class="col-xs-12">\n' +
                fields +
                '                        </div>\n' +
                '\n' +
                '                        <div class="col-xs-12">\n' +
                '                            <div class="' + form_obj_prefix + 'division">\n' +
                '                                <button type="submit" class="' + form_obj_prefix + 'btn_submit">' + this.settings.text_vars.send_button_text + '</button>\n' +
                '                            </div>\n' +
                '                        </div>\n' +
                '                    </div>\n' +
                '\n' +
                '                    <div class="row ' + form_obj_prefix + 'agreements">\n' +
                '                        <div class="col-xs-12">\n' +
                agreements +
                '                        </div>\n' +
                '                    </div>\n' +
                '                </div>\n' +
                '            </form>\n' +
                '        </div>\n' +
                '\n' +
                '        <div class="' + form_obj_prefix + 'footer_section">\n' +
                '\n' +
                '        </div>\n' +
                '    </div>\n' +
                '</div>';

            return $popupBody;
        },

        /*
         * Main function for initializing popup body
         */
        initPopup: function () {
            var objThis = this;

            //form fields
            var fields = this.initPopup_generate_fields();

            //agreements
            var agreements = this.initPopup_generate_popup_agreements();

            //body
            var $popupBody = $(this.initPopup_generate_popup_body(fields, agreements));

            //append the object to DOM
            this.popup.obj = $popupBody.appendTo($(this.element));
            this.popup.form = this.popup.obj.find('form');

            //apply event listeners to elements contained in popup
            this.popupAppendEventListeners();

            //apply miscellaneous plugins
            this.popupApplyMisc();
        },

        /*
         * Append event listeners for clickable elements in popup window
         */
        popupAppendEventListeners: function() {
            var objThis = this;

            //checkbox click
            this.popup.form.find('.checkmark').on('click', function (e) {
                e.preventDefault();
                var input = $(this).siblings('input');
                input.prop('checked', !input.prop('checked'));
            });

            //readmore click
            this.popup.form.find('.' + form_obj_prefix + 'readmore').on('click', function (e) {
                e.preventDefault();
                objThis.showReadmore(this);
            });

            //close click
            this.popup.obj.find('.' + form_obj_prefix + 'btn_close').on('click', function (e) {
                e.preventDefault();
                objThis.ClosePopup();
            });

            //form input blur / input
            this.popup.form.find(input_all_mask).on('input', function (e) {
                //validate input
                var validated = objThis.ValidateInput($(this), {append_status: false});
                //send form if validated
                if(validated) {
                    console.log('validation successful');
                }

                return false;
            });

            //form submit
            this.popup.obj.on('submit', function (e) {
                var status = objThis.SendData();

                //success
                console.log('Submit form status: ' + status.success + ', ' + status.message);

                //todo: unify showing status after sending data
                if(status.success) {
                    //todo: show success in the popup window
                } else {
                    //error
                    if(status === 'error') {
                        //todo: show error in the popup window
                    }
                }

                return false;
            });
        },

        /*
         * Readmore click event
         */
        showReadmore: function (obj) {
            var $this = $(obj);
            $this.closest('.' + form_obj_prefix + 'division').find('.' + form_obj_prefix + 'readmore_body').slideToggle();
        },
        /*
         * Readmore hide all readmore sections
         */
        hideReadmore_all: function() {
            this.popup.form.find('agreements input[type="checkbox"]').prop('checked', false);
        },

        /*
         * Apply miscellaneous plugins (ie. input mask)
         */
        popupApplyMisc: function() {
            /* --- js input mask --- */
            var inputs = $('input');

            //check if exists
            console.log('js input mask: ' + (typeof $.fn.inputmask !== 'undefined'));
            if(typeof $.fn.inputmask !== 'undefined') {
                var input_masked_items = inputs.filter('input[type="tel"], .jsm_phone');
                var phones_mask = ["###-###-###", "## ###-##-##"];

                console.log('js input mask || masked items: ');
                console.log(input_masked_items);

                input_masked_items.inputmask({
                    mask: phones_mask,
                    greedy: false,
                    definitions: {'#': {validator: "[0-9]", cardinality: 1}}
                });
            }
            /* --- /js input mask --- */
        },

        /* -------------------- PUBLIC METHODS -------------------- */

        /* ------ Form data ------ */

        /**
         * @return {boolean}
         */
        SendData: function() {
            var status = {success: false, message: 'SendData: Error (Default)'};

            //find all input in form
            var input = this.popup.form.find(input_all_mask);

            //validate input
            var validated = this.ValidateInput(input);
            //send form if validated
            if(validated) {
                console.log('Validation successful');
                console.log('Attempting to send data...');

                //todo: send AJAX call
                status = this.SendDataAjax({
                    url: this.settings.api_url,
                    api_key: this.settings.api_key,
                    data: this.popup.form.serialize(),
                });
            } else {
                status = {success: false, message: 'SendData: Error (Validation)'};
            }

            return status;
        },
        SendDataAjax: function(options) {
            //[0: succes, 1: message]
            var status = {success: false, message: 'SendDataAjax: Error (Default)'};

            //set settings
            var objThis = this;
            var defaults = {
                url: '/',
                type: 'POST',
                api_key: null,
                data: null,
                success_param: 'success', //bool - true for success, false for failure
                return_param: 'message', //the key of returned data (preferably an array) from the API which contains the response
                callback: {
                    function: null,
                    parameters: null,
                }
            };
            var settings = $.extend({}, defaults, options);

            //AJAX CALL

            //if no ajax call is currently processing
            if(!this.settings.status.ajax_processing) {
                this.settings.status.ajax_processing = true;

                //Configure
                $.ajaxSetup({
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                $.ajax({
                    url: settings.url,
                    type: settings.type,
                    data: settings.data,
                    enctype: 'multipart/form-data',
                    dataType: 'json',
                    processData: false,
                    success: function (data) {
                        if(data[settings.return_param].length > 0) {
                            if (data[settings.success_param]) {
                                for (var index in data[settings.return_param]) {

                                }

                                objThis.ResetInput();
                            }
                            else {
                                for (var index in data[settings.return_param]) {

                                }
                            }
                            //Show message from API
                            console.log('API status: ' + data.status);
                            console.log('API message: ');
                            console.log(data[settings.return_param]);
                        }

                        status = {success: true, message: 'Success (API x:200)'};

                        objThis.settings.status.ajax_processing = false;
                    },
                    error: function (data) {
                        // Error...
                        console.log('API status: ' + data.status);
                        console.log('API message: ');
                        console.log(data[settings.return_param]);

                        status = {success: false, message: 'Error (API x:0)'};

                        objThis.settings.status.ajax_processing = false;
                    }
                });
            }

            //CALLBACK

            //check if callback is set and is a function
            if(settings.callback.function && $.isFunction(settings.callback.function)) {
                //call the callback function after the function is done
                settings.callback.function.call(this, settings.callback.parameters);
            }

            return status;
        },

        /* ------ Popup ------ */

        TogglePopup: function (options) {
            if (this.settings.status.button_disabled) {
                return;
            }

            //var objThis = this;

            if (this.settings.status.popup_hidden) {
                this.ShowPopup(options);
            } else {
                this.ClosePopup(options);
            }
        },

        ShowPopup: function (options) {
            if (this.settings.status.button_disabled) {
                return;
            }

            //set settings
            var objThis = this;
            var defaults = {
                fade_duration: 300,
            };
            var settings = $.extend({}, defaults, options);

            //fade in the popup window
            this.popup.obj.fadeIn(settings.fade_duration);

            //focus first input in popup form
            this.popup.form.find(input_all_mask).first().focus();

            //hide button
            this.button.obj.addClass('hide');

            //change hidden variable to false
            this.settings.status.popup_hidden = false;
        },

        ClosePopup: function (options) {
            if (this.settings.status.button_disabled) {
                return;
            }

            //set settings
            var objThis = this;
            var defaults = {
                fade_duration: 300,
            };
            var settings = $.extend({}, defaults, options);

            //fade out the popup window and reset the input
            this.popup.obj.fadeOut(settings.fade_duration, function () {
                objThis.ResetInput();
            });

            //hide button
            this.button.obj.removeClass('hide');

            //change hidden variable to true
            this.settings.status.popup_hidden = true;
        },

        DisableButton: function (input) {
            this.settings.status.button_disabled = !!input;
        },

        /* ------ Input ------ */

        /**
         * @return {boolean}
         */
        //todo: validate input
        ValidateInput: function (input, options) {
            var defaults = {
                append_status: true,
                fade_duration: 300,
            };
            var settings = $.extend({}, defaults, options);

            //var form = this.popup.form;//this.popup.obj.find('form');
            //todo: cache input objects
            //var _input = form.find(input_all_mask);
            var _input = input;

            //return value. If all inputs are correctly validated, the value will remain true. If one fails, it switches to false
            var is_valid = true;

            //group by type
            var i_text = _input.filter('[type="text"], [type="tel"], textarea');
            var i_checkbox = _input.filter('[type="checkbox"]');

            /* --- Validation --- */

            //define regex for field types
            var regex;

            //phones
            //define regex for field types
            regex = /(\(?(\+|00)?48\)?([ -]?))?(\d{3}[ -]?\d{3}[ -]?\d{3})|([ -]?\d{2}[ -]?\d{3}[ -]?\d{2}[ -]?\d{2})/;

            //wrong inputs collection
            var wrong_inputs = []; // {obj: null, message: null}
            i_text.each(function() {
                var $this = $(this);
                var $this_val = $this.val();
                var $this_container = $this.closest('.input');

                var valid = regex.test($this_val); //match()

                //remove old status
                var old_obj = $this.siblings('.' + form_obj_prefix + 'status');
                old_obj.fadeOut(settings.fade_duration, function() {
                    old_obj.remove();
                });

                //apply / remove classes from inputs / input containers
                if(valid) {
                    $this.removeClass('wrong-input'); $this_container.removeClass('wrong-input');
                    $this.addClass('correct-input'); $this_container.addClass('correct-input');
                } else {
                    $this.removeClass('correct-input'); $this_container.removeClass('correct-input');
                    $this.addClass('wrong-input'); $this_container.addClass('wrong-input');

                    wrong_inputs.push({obj: $this, message: ''});

                    //add element signifying wrong input
                    if(settings.append_status) {
                        var $wrong_input_obj = $('<span class="' + form_obj_prefix +'status"></span>');
                        $wrong_input_obj.text('Wrong input');
                        $wrong_input_obj.hide();

                        $wrong_input_obj.insertAfter($this);

                        $wrong_input_obj.fadeIn(settings.fade_duration);
                    }

                    is_valid = false;
                    //return false; //break the each loop or continue (true) checking other inputs to apply wrong input class
                }
            });

            if(wrong_inputs.length > 0) {
                //sort by position in DOM
                wrong_inputs = this.objSortByPositionInDOM(wrong_inputs, 'obj');

                wrong_inputs[0].obj.focus();
            }

            //xxx

            /* --- /Validation --- */

            return is_valid;
        },
        ResetInput: function () {
            var form = this.popup.form;//this.popup.obj.find('form');
            form[0].reset();

            /*
            var input = form.find(input_all_mask);
            input.filter('[type="text"], [type="tel"], textarea').val('');
            input.filter('[type="checkbox"]').prop('checked', true);
            input.filter('select').prop('selectedIndex',0);
            */

            this.hideReadmore_all();
        },

        /* ------------------------------ HELPERS ------------------------------- */

        /*
         * Input: Array[]
         * Output: String
         * Function that formats data attributes into a string
         */
        formatData: function(input) {
            var _input = input;
            var input_length = _input.length;
            var output = '';
            if (_input) {
                output += ' ';

                //is array
                if (input.constructor === Array) {
                    for (var i = 0; i < input_length; i++) {
                        output += 'data-' + _input[i][0] + '=' + _input[i][1] + ' ';
                    }
                    if (output[output.length - 1] == ' ') {
                        output = output.slice(0, -1);
                    }
                } else {
                    output += 'data-' + _input;
                }
            }

            return output;
        },

        /*
         * Input: Object
         * Output: Object
         * Function that formats attribute keys and their values into a string, which is to be inserted into the proper html tag
         * To retrieve the string, use the genearated key obj[x].formatted
         */
        formatDynamicAttributes: function(collection) {
            var _collection = collection;
            for(var i = 0; i < _collection.length; i++) {
                var attributes = _collection[i].attributes;
                var formatted = '';

                //format attributes into a string
                for(var x = 0; x < attributes.length; x++) {
                    //open attr
                    formatted += attributes[x].key + '="';
                    //insert attr value
                    formatted += attributes[x].value;
                    //close attr
                    formatted += '" ';
                }

                //remove last space
                if(formatted.length > 0 && formatted[formatted.length-1] == ' ') {
                    formatted = formatted.slice(0, -1);
                }

                _collection[i].formatted = formatted;
            }

            return _collection;
        },

        /*
         * Sort an array containing DOM elements by their position in the document (top to bottom)
         */
        objSortByPositionInDOM: function(input, attr) {
            //sort by position in DOM
            var _input = input;
            var output;
            if(attr) {
                output = _input.sort(function(a,b) {
                    if( a[attr][0] === b[attr][0]) return 0;
                    if( !a[0].compareDocumentPosition) {
                        // support for IE8 and below
                        return a[attr][0].sourceIndex - b[attr].sourceIndex;
                    }
                    if( a[attr][0].compareDocumentPosition(b[attr][0]) & 2) {
                        // b comes before a
                        return 1;
                    }
                    return -1;
                });
            } else {
                output = _input.sort(function(a,b) {
                    if( a[0] === b[0]) return 0;
                    if( !a[0].compareDocumentPosition) {
                        // support for IE8 and below
                        return a[0].sourceIndex - b.sourceIndex;
                    }
                    if( a[0].compareDocumentPosition(b[0]) & 2) {
                        // b comes before a
                        return 1;
                    }
                    return -1;
                });
            }

            return output;
        },
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        var instances = [];

        this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                var instance = new Plugin(this, options);
                $.data(this, "plugin_" +
                    pluginName, instance);
                instances.push(instance);
            }
        });

        if (instances.length === 1) {
            return instances[0];
        }

        return null

        /*
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                var instance = new Plugin(this, options);
                $.data(this, "plugin_" +
                    pluginName, instance);
            }
        });
        */
    };

    /*
    $.fn.swyftCallback = function () {
        return {
            DisableButton: function(input) {
                this.DisableButton(input);
            }
        }
    };
    */

})(jQuery, window, document);