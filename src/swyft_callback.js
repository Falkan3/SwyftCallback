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
        form_fields_prefix = 'sc_fld_',
        defaults = {
            api_url: "test",
            form_method: "post",
            //data
            custom_button_class: "",
            custom_button_data: "",
            custom_popup_class: "",
            custom_popup_data: "",
            //status
            popup_hidden: true,
            button_disabled: false, //disable show/close functionality
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
            },
            agreements: [
                {
                    short: 'Lorem',
                    long: 'Ipsum',
                    readmore: 'More'
                }
            ]
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

        //set default vars
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

        initButton: function () {
            var objThis = this;
            var classes = this.formatClasses(this.settings.custom_button_class);
            var data = this.formatData(this.settings.custom_button_data);
            var $buttonBody = $(
                '<div class="sc_tg_btn' + classes + '" ' + data + '>\n' +
                '    <div class="sc_round_container">\n' +
                '        <div class="sc_icon">' +
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

                var output = '<div class="sc_division">\n' +
                    '               <div class="input">\n' +
                    '                   <label for="sc_fld_telephone">' + field.label + '</label>\n' +
                    '                   <input ' + dynamic_attributes[0].formatted + '/>\n' +
                    '               </div>\n' +
                    '             </div>\n';
                fields += output;
            }

            return fields;
        },
        initPopup_generate_popup_agreements: function() {
            var agreements = '';
            for (var i = 0; i < this.settings.agreements.length; i++) {
                var agreement = this.settings.agreements[i];
                var output = '<div class="sc_division">\n' +
                    '                   <div class="sc_checkbox_container">\n' +
                    '                       <input id="sc_fld_agreement_' + i + '" type="checkbox" checked="checked" />\n' +
                    '                       <span class="checkmark"></span>\n' +
                    '                   </div>\n' +
                    '\n' +
                    '                   <label for="sc_fld_agreement_' + i + '">' + agreement.short + ' <span class="sc_readmore">' + agreement.readmore + ' </span></label>\n' +
                    '                   <span class="sc_readmore_body" style="display: none;">\n' +
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

            var $popupBody = '<div class="sc_overlay" style="display: none;">\n' +
                '    <div class="sc_popup' + classes + '">\n' +
                '        <div class="sc_btn_close"></div>\n' +
                '        <div class="sc_title_section">\n' +
                '            <p>' + this.settings.text_vars.popup_title + '</p>\n' +
                '        </div>\n' +
                '\n' +
                '        <div class="sc_body_section">\n' +
                '            <form ' + dynamic_attributes[0].formatted + '>\n' +
                '                <div class="container-fluid">\n' +
                '                    <div class="row">\n' +
                '                        <div class="col-xs-12">\n' +
                fields +
                '                        </div>\n' +
                '\n' +
                '                        <div class="col-xs-12">\n' +
                '                            <div class="sc_division">\n' +
                '                                <button type="submit" class="sc_btn_submit">' + this.settings.text_vars.send_button_text + '</button>\n' +
                '                            </div>\n' +
                '                        </div>\n' +
                '                    </div>\n' +
                '\n' +
                '                    <div class="row sc_agreements">\n' +
                '                        <div class="col-xs-12">\n' +
                agreements +
                '                        </div>\n' +
                '                    </div>\n' +
                '                </div>\n' +
                '            </form>\n' +
                '        </div>\n' +
                '\n' +
                '        <div class="sc_footer_section">\n' +
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

            this.popup.obj = $popupBody.appendTo($(this.element));
            this.popup.form = this.popup.obj.find('form');

            this.popupAppendEventListeners();
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
            this.popup.form.find('.sc_readmore').on('click', function (e) {
                e.preventDefault();
                objThis.showReadmore(this);
            });

            //close click
            this.popup.obj.find('.sc_btn_close').on('click', function (e) {
                e.preventDefault();
                objThis.ClosePopup();
            });

            //form submit
            this.popup.obj.on('submit', function (e) {
                //find all input in form
                var input = objThis.popup.form.find('input, textarea, select');

                //validate input
                var validated = objThis.ValidateInput(input);
                //send form if validated
                if(validated) {
                    console.log('validation successful');
                }

                return false;
            });
        },

        /*
         * Readmore click event
         */
        showReadmore: function (obj) {
            var $this = $(obj);
            $this.closest('.sc_division').find('.sc_readmore_body').slideToggle();
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

        /* ------ Popup ------ */

        TogglePopup: function (options) {
            if (this.settings.button_disabled) {
                return;
            }

            //var objThis = this;

            if (this.settings.popup_hidden) {
                this.ShowPopup(options);
            } else {
                this.ClosePopup(options);
            }
        },
        ShowPopup: function (options) {
            if (this.settings.button_disabled) {
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
            this.popup.form.find('input, select').first().focus();

            //hide button
            this.button.obj.addClass('hide');

            //change hidden variable to false
            this.settings.popup_hidden = false;
        },
        ClosePopup: function (options) {
            if (this.settings.button_disabled) {
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
            this.settings.popup_hidden = true;
        },
        DisableButton: function (input) {
            this.settings.button_disabled = !!input;
        },

        /* ------ Input ------ */

        //todo: validate input
        ValidateInput: function (input) {
            //var form = this.popup.form;//this.popup.obj.find('form');
            //todo: cache input objects
            //var _input = form.find('input, textarea, select');
            var _input = input;

            //group by type
            var i_text = _input.filter('[type="text"], [type="tel"], textarea');
            var i_checkbox = _input.filter('[type="checkbox"]');

            //define regex for field types
            var regex_phone = '(?<!\w)(\(?(\+|00)?48\)?)?[ -]?\d{3}[ -]?\d{3}[ -]?\d{3}(?!\w)';

            /* --- Validation --- */



            /* --- /Validation --- */

            return false;
        },
        ResetInput: function () {
            var form = this.popup.form;//this.popup.obj.find('form');
            form[0].reset();

            /*
            var input = form.find('input, select');
            input.filter('[type="text"], [type="tel"], textarea').val('');
            input.filter('[type="checkbox"]').prop('checked', true);
            input.filter('select').prop('selectedIndex',0);
            */

            this.hideReadmore_all();
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