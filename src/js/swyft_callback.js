/*
 *  Swyft Callback - v0.2.1
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
        form_fields_prefix = form_obj_prefix + 'fld_',
        input_all_mask = 'input, select, textarea',

        defaults = {
            api: {
                url: 'test',
                custom: [
                    {name: 'api_key', value: ''},
                ],
                param: {
                    success: {name: 'result', value: 'success'}, //parameter named result will contain information about the call's success
                    message: '', //the key of returned data (preferably an array) from the API which contains the response
                },
            },
            //data
            data: {
                form_method: "post",
                send_headers: true,
                custom_button_data: "",
                custom_popup_data: "",
            },
            //appearance
            appearance: {
                custom_button_class: "",
                custom_popup_class: "",
                show_check_all_agreements: true,
                overflown_overlay: true,
            },
            //status
            status: {
                popup_hidden: true,
                popup_body_collapsed: false,
                button_disabled: false, //disable show/close functionality
                ajax_processing: false,
                response_from_api_visible: true,
            },
            //content - text
            text_vars: {
                popup_title: "Contact form",
                popup_body: "Leave us your phone number. We'll call you back.",
                send_button_text: "Send",
                wrong_input_text: "Wrong input",
                status_success: "Form sent successfuly",
                status_sending: "Sending form...",
                status_error: "Server encountered an error",
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
                        data_field_type: 'phone', //possible types: phone, name, email. Used for regex_table
                        placeholder: '000-000-000',
                        max_length: 20,
                        required: true
                    },
                ],
                agreements: [
                    {
                        obj: null,
                        field_name: form_fields_prefix + 'agreement',
                        type: 'checkbox',
                        short: 'Lorem',
                        long: 'Ipsum',
                        readmore: 'More',
                        required: true,
                        checked: true,
                    }
                ],
                check_all_agreements: {
                    obj: null,
                    short: 'Check all agreements',
                },
                regex_table: {
                    'phone': /(\(?(\+|00)?48\)?([ -]?))?(\d{3}[ -]?\d{3}[ -]?\d{3})|([ -]?\d{2}[ -]?\d{3}[ -]?\d{2}[ -]?\d{2})/,
                    'email': /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                    //^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčśšśžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŚŠŚŽ∂ð ,.'-]+$
                    'name': /^[a-zA-Z\u00E0\u00E1\u00E2\u00E4\u00E3\u00E5\u0105\u010D\u0107\u0119\u00E8\u00E9\u00EA\u00EB\u0117\u012F\u00EC\u00ED\u00EE\u00EF\u0142\u0144\u00F2\u00F3\u00F4\u00F6\u00F5\u00F8\u00F9\u00FA\u00FB\u00FC\u0173\u016B\u00FF\u00FD\u017C\u017A\u00F1\u00E7\u010D\u015B\u0161\u015B\u017E\u00C0\u00C1\u00C2\u00C4\u00C3\u00C5\u0104\u0106\u010C\u0116\u0118\u00C8\u00C9\u00CA\u00CB\u00CC\u00CD\u00CE\u00CF\u012E\u0141\u0143\u00D2\u00D3\u00D4\u00D6\u00D5\u00D8\u00D9\u00DA\u00DB\u00DC\u0172\u016A\u0178\u00DD\u017B\u0179\u00D1\u00DF\u00C7\u0152\u00C6\u010C\u015A\u0160\u015A\u017D\u2202\u00F0 ,.'-]+$/,
                },
                //dictionary is used to exchange input names into values from the dictionary on API request
                data_dictionary: {} //'sc_fld_telephone': 'phone'
            },
            callbacks: {
                onShow: null,
                onHide: null,
                onSend: {
                    success: {
                        function: null,
                        this: this,
                        parameters: null,
                    },
                    error: {
                        function: null,
                        this: this,
                        parameters: null,
                    }
                }
            }
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend(true, {}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        //set default vars for the fields in form
        this.setDefaultVars();

        //dynamic vars
        this.html = $('html');
        //button used to bring up popup window
        this.button = {
            obj: null
        };
        //popup window
        this.popup = {
            obj: null, form: null, body: null, footer: null
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
        setDefaultVars: function () {
            //set default vars for form fields
            if (this.settings.input.fields) {
                var template = defaults.input.fields[0];
                for (var i = 0; i < this.settings.input.fields.length; i++) {
                    this.settings.input.fields[i] = $.extend({}, template, this.settings.input.fields[i]);
                }
            }

            //set default vars for agreements
            if (this.settings.input.agreements) {
                var template = defaults.input.agreements[0];
                for (var i = 0; i < this.settings.input.agreements.length; i++) {
                    this.settings.input.agreements[i] = $.extend({}, template, this.settings.input.agreements[i]);
                }
            }
        },
        formatClasses: function (input) {
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
            var classes = this.formatClasses(this.settings.appearance.custom_button_class);
            var data = this.formatData(this.settings.data.custom_button_data);
            var $buttonBody = $(
                '<div class="' + form_obj_prefix + 'tg_btn' + classes + '" ' + data + '>\n' +
                '    <div class="' + form_obj_prefix + 'round_container">\n' +
                '        <div class="' + form_obj_prefix + 'icon">' +
                '           <a href="#"></a>\n' +
                '        </div>\n' +
                '    </div>\n' +
                '    <div class="sc_ripple"></div>\n' +
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
        initPopup_generate_fields: function (popupBody) {
            //form fields
            var fields = '';
            var dynamic_attributes = [];

            if (this.settings.input.fields) {
                var fields_section = popupBody.find('.' + form_obj_prefix + 'fields_section');

                for (var i = 0; i < this.settings.input.fields.length; i++) {
                    var field = this.settings.input.fields[i];

                    // generate attributes for popup body
                    dynamic_attributes = [
                        //0 - form input
                        {
                            name: 'input',
                            attributes: [
                                {key: 'id', value: field.field_name},
                                {key: 'name', value: field.field_name},
                                {key: 'type', value: field.type},
                                {key: 'data-field-type', value: field.data_field_type},
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
                        '                   <label for="' + field.field_name + '">' + field.label + '</label>\n' +
                        '                   <input ' + dynamic_attributes[0].formatted + '/>\n' +
                        '               </div>\n' +
                        '             </div>\n';
                    fields += output;

                    //save created DOM object in settings field reference
                    var $obj = $(output).appendTo(fields_section);
                    this.settings.input.fields[i].obj = $obj.find(input_all_mask).first();
                }
            }

            return fields;
        },
        initPopup_generate_popup_agreements: function (popupBody) {
            var agreements_section = popupBody.find('.' + form_obj_prefix + 'agreements_section');
            var agreements = '';
            var output = '';
            var $obj = null;

            if (this.settings.input.agreements) {
                //append check all agreements button
                if (this.settings.appearance.show_check_all_agreements && this.settings.input.agreements.length > 0) {
                    output = '<div class="' + form_obj_prefix + 'division">\n' +
                        '               <div class="input">\n' +
                        '                   <div class="' + form_obj_prefix + 'checkbox_container">\n' +
                        '                       <input id="' + form_fields_prefix + 'agreement_all" name="' + form_fields_prefix + 'agreement_all" type="checkbox" data-field-type="checkbox" />\n' +
                        '                       <span class="checkmark"></span>\n' +
                        '                   </div>\n' +
                        '\n' +
                        '                   <label for="' + form_fields_prefix + 'agreement_all">' + this.settings.input.check_all_agreements.short + '</label>\n' +
                        '               </div>\n' +
                        '          </div>';

                    //save created DOM object in settings field reference
                    $obj = $(output).appendTo(agreements_section);
                    this.settings.input.check_all_agreements.obj = $obj.find(input_all_mask).first();
                }

                for (var i = 0; i < this.settings.input.agreements.length; i++) {
                    var agreement = this.settings.input.agreements[i];

                    var dynamic_attributes = [];
                    // generate attributes for agreement
                    dynamic_attributes = [
                        //0
                        {
                            name: agreement.field_name,
                            attributes: [
                                {key: 'id', value: agreement.field_name},
                                {key: 'name', value: agreement.field_name},
                                {key: 'type', value: 'checkbox'},
                                {key: 'value', value: 'true'},
                                {key: 'data-field-type', value: 'checkbox'},
                            ],
                            formatted: ''
                        },
                    ];
                    if (agreement.checked) {
                        dynamic_attributes[0].attributes.push({key: 'checked', value: 'checked'});
                    }
                    dynamic_attributes = this.formatDynamicAttributes(dynamic_attributes);

                    output = '<div class="' + form_obj_prefix + 'division">' +
                        '           <div class="input">' +
                        '               <div class="' + form_obj_prefix + 'checkbox_container">\n' +
                        '                   <input ' + dynamic_attributes[0].formatted + ' />\n' +
                        '                   <span class="checkmark"></span>\n' +
                        '               </div>\n' +
                        '\n' +
                        '               <label for="' + agreement.field_name + '">' + agreement.short + ' <span class="' + form_obj_prefix + 'readmore">' + agreement.readmore + ' </span></label>\n' +
                        '               <div class="' + form_obj_prefix + 'readmore_body" style="display: none;">\n' +
                        '                   <span>\n' +
                        '                   ' + agreement.long +
                        '                   </span>\n' +
                        '               </div>' +
                        '           </div>' +
                        '         </div>';
                    agreements += output;

                    //save created DOM object in settings field reference
                    $obj = $(output).appendTo(agreements_section);
                    this.settings.input.agreements[i].obj = $obj.find(input_all_mask).first();
                }
            }

            return agreements;
        },
        initPopup_generate_popup_body: function () {
            var dynamic_attributes = [];

            // generate attributes for popup body
            var classes = this.formatClasses(this.settings.appearance.custom_popup_class);
            dynamic_attributes = [
                //0
                {
                    name: 'form',
                    attributes: [
                        {key: 'action', value: this.settings.api.url},
                        {key: 'method', value: this.settings.data.form_method},
                        {key: 'novalidate', value: this.settings.novalidate},
                    ],
                    formatted: ''
                },
            ];
            dynamic_attributes = this.formatDynamicAttributes(dynamic_attributes);

            var $popupBody = '<div class="' + form_obj_prefix + 'overlay" style="display: none;">\n' +
                '    <div class="' + form_obj_prefix + 'popup_container">\n' +
                '        <div class="' + form_obj_prefix + 'popup' + classes + '">\n' +
                '            <div class="' + form_obj_prefix + 'btn_close"></div>\n' +
                '            <div class="' + form_obj_prefix + 'title_section">\n' +
                '                <p>' + this.settings.text_vars.popup_title + '</p>\n' +
                '            </div>\n' +
                '\n' +
                '            <div class="' + form_obj_prefix + 'body_section">\n' +
                '                <p>' + this.settings.text_vars.popup_body + '</p>\n' +
                '                <form ' + dynamic_attributes[0].formatted + '>\n' +
                '                    <div class="container-fluid no-padding">\n' +
                '                        <div class="row">\n' +
                '                            <div class="col-xs-12 ' + form_obj_prefix + 'fields_section">\n' +
                //fields +
                '                            </div>\n' +
                '\n' +
                '                            <div class="col-xs-12">\n' +
                '                                <div class="' + form_obj_prefix + 'division">\n' +
                '                                    <button type="submit" class="' + form_obj_prefix + 'btn_submit">' + this.settings.text_vars.send_button_text + '</button>\n' +
                '                                </div>\n' +
                '                            </div>\n' +
                '                        </div>\n' +
                '\n' +
                '                        <div class="row ' + form_obj_prefix + 'agreements">\n' +
                '                            <div class="col-xs-12 ' + form_obj_prefix + 'agreements_section">\n' +
                //agreements +
                '                            </div>\n' +
                '                        </div>\n' +
                '                    </div>\n' +
                '                </form>\n' +
                '            </div>\n' +
                '\n' +
                '            <div class="' + form_obj_prefix + 'footer_section">\n' +
                '\n' +
                '            </div>\n' +
                '        </div>\n' +
                '    </div>' +
                '</div>';

            return $popupBody;
        },

        /*
         * Main function for initializing popup body
         */
        initPopup: function () {
            var objThis = this;

            //body
            var $popupBody = $(this.initPopup_generate_popup_body());

            //append the object to DOM
            this.popup.obj = $popupBody.appendTo($(this.element));

            //find references to sections
            this.popup.form = this.popup.obj.find('form');
            this.popup.body = this.popup.obj.find('.' + form_obj_prefix + 'body_section');
            this.popup.footer = this.popup.obj.find('.' + form_obj_prefix + 'footer_section');

            //form fields
            //add fields to popup body
            //var fields =
            this.initPopup_generate_fields($popupBody);

            //agreements
            //add agreements to popup body
            //var agreements =
            this.initPopup_generate_popup_agreements($popupBody);

            //apply event listeners to elements contained in popup
            this.popupAppendEventListeners();

            //apply miscellaneous plugins
            this.popupApplyMisc();
        },

        /*
         * Append event listeners for clickable elements in popup window
         */
        popupAppendEventListeners: function () {
            var objThis = this;

            //checkbox click
            this.popup.form.find('.checkmark').on('click', function (e) {
                e.preventDefault();
                var input = $(this).siblings('input');
                var is_checked = input.prop('checked');
                input.prop('checked', !is_checked).trigger('change', []);
            });

            //readmore click
            this.popup.form.find('.' + form_obj_prefix + 'readmore').on('click', function (e) {
                e.preventDefault();
                objThis.showReadmore(this);
            });

            //close click
            this.popup.obj.find('.' + form_obj_prefix + 'btn_close').on('click', function (e) {
                e.preventDefault();
                objThis.HidePopup();
            });

            //form input blur / input
            for (var i = 0; i < objThis.settings.input.fields.length; i++) {
                var field = objThis.settings.input.fields[i];
                field.obj.data('index', i);
                field.obj.on('input', function (e) {
                    var index = $(this).data('index');
                    //validate input
                    var validated = objThis.ValidateForm([objThis.settings.input.fields[index]], {append_status: false, focus_first_wrong: false});
                    //send form if validated
                    if (validated) {
                        console.log('validation successful');
                    }

                    return false;
                });
            }

            //form agreement blur / input
            for (var i = 0; i < objThis.settings.input.agreements.length; i++) {
                var agreement = objThis.settings.input.agreements[i];
                agreement.obj.data('index', i);
                agreement.obj.on('change', function (e, _no_check_all_status) {
                    var index = $(this).data('index');
                    //validate input
                    var validated = objThis.ValidateForm([objThis.settings.input.agreements[index]], {append_status: false, focus_first_wrong: false});
                    //send form if validated
                    if (validated) {
                        console.log('validation successful');
                    }

                    if (!_no_check_all_status) {
                        //change the check prop of check all button according to the status of all agreements
                        objThis.input_checkbox_check_all_status();
                    }

                    return false;
                });
            }

            //checkbox check all click
            if (this.settings.appearance.show_check_all_agreements) {
                this.settings.input.check_all_agreements.obj.on('change', function (e, _no_check_all_status) {
                    if (!_no_check_all_status) {
                        var is_checked = $(this).prop('checked');

                        //change checked status on all agreements to the prop of check all button
                        for (var i = 0; i < objThis.settings.input.agreements.length; i++) {
                            objThis.settings.input.agreements[i].obj.prop('checked', is_checked).trigger('change', [true]);
                        }
                    }
                });
            }

            //change the check prop of check all button according to the status of all agreements
            objThis.input_checkbox_check_all_status();

            //form submit
            this.popup.obj.on('submit', function (e) {
                var status = objThis.SendData({
                    callback: {
                        success: {
                            function: objThis.SendDataReturn,
                            this: objThis,
                            parameters: [{reset_input: true, message: objThis.settings.text_vars.status_success, style: 'success'}]
                        },
                        error: {
                            function: objThis.SendDataReturn,
                            this: objThis,
                            parameters: [{reset_input: false, message: objThis.settings.text_vars.status_error, style: 'error'}]
                        }
                    }
                });

                //status
                console.log('Submit form status: ' + status.success + ', ' + status.message);

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
        hideReadmore_all: function () {
            this.popup.form.find('.agreements input[type="checkbox"]').prop('checked', false);
        },

        /*
         * Apply miscellaneous plugins (ie. input mask)
         */
        popupApplyMisc: function () {
            /* --- js input mask --- */
            var inputs = this.popup.form.find(input_all_mask);

            //check if exists
            console.log('js input mask: ' + (typeof $.fn.inputmask !== 'undefined'));
            if (typeof $.fn.inputmask !== 'undefined') {
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

        /*
         * Change the check prop of check all button according to the status of all agreements
         */
        input_checkbox_check_all_status: function () {
            if (this.settings.appearance.show_check_all_agreements) {
                var all_checked = true;

                for (var i = 0; i < this.settings.input.agreements.length; i++) {
                    if (!this.settings.input.agreements[i].obj.prop('checked')) {
                        all_checked = false;
                    }
                }

                this.settings.input.check_all_agreements.obj.prop('checked', all_checked).trigger('change', [true]);
            }
        },

        /* -------------------- PUBLIC METHODS -------------------- */

        /* ------ Form data ------ */

        /**
         * @return {boolean}
         */
        SendData: function (options) {
            var status = {success: false, message: 'SendData: Error (Default)'};

            var defaults = {
                url: this.settings.api.url,
                api_custom: this.settings.api.custom,
                data: this.popup.form.serialize(),
                data_dictionary: this.settings.input.data_dictionary,
                type: this.settings.data.form_method,
                success_param: this.settings.api.param.success, //bool - true for success, false for failure
                return_param: this.settings.api.param.message, //the key of returned data (preferably an array) from the API which contains the response
                status_sending_text: this.settings.text_vars.status_sending,
                send_headers: this.settings.data.send_headers
            };
            var settings = $.extend(true, {}, defaults, options);

            //remove all status messages
            this.StatusClear();

            //find all input in form
            //var input = this.popup.form.find(input_all_mask);

            //validate input
            var validated_fields = this.ValidateForm(this.settings.input.fields);
            var validated_agreements = this.ValidateForm(this.settings.input.agreements);
            var validated = validated_fields && validated_agreements;

            //send form if validated
            if (validated) {
                console.log('Validation successful');
                console.log('Attempting to send data...');

                //set message showing that data is being sent
                this.StatusClear();
                this.StatusAdd(settings.status_sending_text, {});

                status = this.SendDataAjax(settings);
            } else {
                status = {success: false, message: 'SendData: Error (Validation)'};
            }

            return status;
        },
        SendDataAjax: function (options) {
            var status = {success: false, message: 'SendDataAjax: Error (Default)'};

            //set settings
            var objThis = this;
            var defaults = {
                url: '/',
                type: 'POST',
                api_custom: [],
                data: '',
                data_dictionary: {},
                success_param: {name: 'result', value: 'success'}, //name of parameter in returned data from API that contains the success reponse
                return_param: 'message', //the key of returned data (preferably an array) from the API which contains the response message
                send_headers: true,
                /*
                callback: {
                    success: {
                        function: alert,
                        this: undefined,
                        parameters: ['api success'],
                    },
                    error: {
                        function: alert,
                        this: undefined,
                        parameters: ['api error'],
                    }
                }
                */
            };
            var settings = $.extend(true, {}, defaults, options);

            //extend data from form with custom data
            if (settings.api_custom) {
                var api_custom_length = settings.api_custom.length;
                var custom_data_string = '';

                if (settings.data.length > 0) {
                    custom_data_string += '&';
                }

                for (var i = 0; i < api_custom_length; i++) {
                    custom_data_string += settings.api_custom[i].name + '=' + settings.api_custom[i].value;

                    if (i < api_custom_length - 1) {
                        custom_data_string += '&';
                    }
                }

                settings.data += encodeURI(custom_data_string);
            }

            //use a custom dictionary specific to API to convert key names to the valid values
            var data_dictionary_keys = Object.keys(settings.data_dictionary);
            for (var i = 0; i < data_dictionary_keys.length; i++) {
                var regex = settings.data_dictionary[data_dictionary_keys[i]];
                console.log(data_dictionary_keys[i] + ' > ' + regex);
                //use regex to replace form field names into those specified in the dictionary
                settings.data = settings.data.replace(data_dictionary_keys[i], regex);
            }

            console.log(settings);

            //AJAX CALL

            //if no ajax call is currently processing
            if (this.settings.status.ajax_processing) {
                status = {success: false, message: 'SendDataAjax: Error (Processing...)'};
            } else {
                this.settings.status.ajax_processing = true;
                status = {success: true, message: 'SendDataAjax: Success (Got into ajax)'};

                //Configure
                if (settings.send_headers) {
                    $.ajaxSetup({
                        headers: {
                            //'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                }

                $.ajax({
                    url: settings.url,
                    type: settings.type,
                    data: settings.data,
                    enctype: 'multipart/form-data',
                    dataType: 'json',
                    processData: false,
                    success: function (data) {
                        var response_success = false;
                        var return_message;

                        console.log(data);

                        if (data[settings.return_param]) {
                            for (var index in data[settings.return_param]) {
                                console.log(data[settings.return_param][index]);
                            }

                            //Show message from API
                            console.log('API status: ' + data.status);
                            console.log('API message: ');
                            console.log(data[settings.return_param]);
                        }

                        //format return message
                        if ($.isArray(data[settings.return_param])) {
                            return_message = data[settings.return_param].join(', ');
                        } else {
                            return_message = data[settings.return_param];
                        }
                        console.log(return_message);

                        //check if the call to API was successful
                        if (data[settings.success_param.name]) {
                            if (data[settings.success_param.name] === settings.success_param.value) {
                                status = {success: true, message: 'Success (API x:200)'};

                                response_success = true;
                            } else {
                                response_success = false;
                            }
                        } else {
                            response_success = false;
                        }

                        //perform callbacks according to response status
                        if (response_success) {
                            //CALLBACK
                            //SUCCESS
                            //check if callback is set and is a function
                            if (settings.callback.success.function && $.isFunction(settings.callback.success.function)) {
                                //call the callback function after the function is done
                                settings.callback.success.function.apply(settings.callback.success.this, settings.callback.success.parameters);
                            }
                            //callback from obj settings
                            if (objThis.settings.callbacks.onSend.success.function && $.isFunction(objThis.settings.callbacks.onSend.success.function)) {
                                objThis.settings.callbacks.onSend.success.function.apply(objThis.settings.callbacks.onSend.success.this, [$.extend(true, {}, data, objThis.settings.callbacks.onSend.success.parameters)]);
                            }
                        } else {
                            //CALLBACK
                            //ERROR
                            //check if callback is set and is a function
                            if (settings.callback.error.function && $.isFunction(settings.callback.error.function)) {
                                //call the callback function after the function is done
                                settings.callback.error.function.apply(settings.callback.error.this, settings.callback.error.parameters);
                            }
                            //callback from obj settings
                            if (objThis.settings.callbacks.onSend.error.function && $.isFunction(objThis.settings.callbacks.onSend.error.function)) {
                                objThis.settings.callbacks.onSend.error.function.apply(objThis.settings.callbacks.onSend.error.this, [$.extend(true, {}, data, objThis.settings.callbacks.onSend.error.parameters)]);
                            }

                            //if show response from api settings is set to true, view the message
                            if (objThis.settings.status.response_from_api_visible && return_message) {
                                objThis.StatusAdd(return_message, {style: 'error'});
                            }
                        }

                        objThis.settings.status.ajax_processing = false;
                    },
                    error: function (data) {
                        // Error...
                        console.log('API status: ' + data.status);
                        console.log('API message: ');
                        console.log(data[settings.return_param]);

                        status = {success: false, message: 'Error (API x:0)'};

                        objThis.settings.status.ajax_processing = false;

                        //CALLBACK

                        //ERROR
                        //check if callback is set and is a function
                        if (settings.callback.error.function && $.isFunction(settings.callback.error.function)) {
                            //call the callback function after the function is done
                            settings.callback.error.function.apply(settings.callback.error.this, settings.callback.error.parameters);
                        }
                        if (objThis.settings.callbacks.onSend.error.function && $.isFunction(objThis.settings.callbacks.onSend.error.function)) {
                            objThis.settings.callbacks.onSend.error.function.apply(objThis.settings.callbacks.onSend.error.this, objThis.settings.callbacks.onSend.error.parameters);
                        }
                    }
                });
            }

            return status;
        },

        /* Status messages */

        StatusAdd: function (_message, options) {
            //set settings
            var defaults = {
                fade_duration: 300,
                style: ''
            };
            var settings = $.extend({}, defaults, options);

            /* --- */

            var message = $('<p></p>');
            message.text(_message);
            message.appendTo(this.popup.footer);
            message.hide();

            if (settings.style === 'success') {
                this.StatusClearStyle();
                this.popup.footer.addClass('success');
            } else if (settings.style === 'error') {
                this.StatusClearStyle();
                this.popup.footer.addClass('error');
            }

            message.fadeIn(settings.fade_duration);
        },
        StatusClearStyle: function () {
            //reset css classes
            this.popup.footer.removeClass('success error');
        },
        StatusClear: function () {
            this.StatusClearStyle();
            //remove contents
            this.popup.footer.empty();
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
                this.HidePopup(options);
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

            //add overflown class to the overlay to disable content scrolling
            if (objThis.settings.appearance.overflown_overlay) {
                this.html.addClass('overflown');
            }

            //fade in the popup window
            this.popup.obj.fadeIn(settings.fade_duration);

            //focus first input in popup form
            this.popup.form.find(input_all_mask).first().focus();

            //hide button
            this.button.obj.addClass('hide');

            //change hidden variable to false
            this.settings.status.popup_hidden = false;

            //callback from obj settings
            if (objThis.settings.callbacks.onShow.function && $.isFunction(objThis.settings.callbacks.onShow.function)) {
                objThis.settings.callbacks.onShow.function.apply(objThis.settings.callbacks.onShow.this, [$.extend(true, {}, this, objThis.settings.callbacks.onShow.parameters)]);
            }
        },

        HidePopup: function (options) {
            if (this.settings.status.button_disabled) {
                return;
            }

            //set settings
            var objThis = this;
            var defaults = {
                fade_duration: 300,
            };
            var settings = $.extend({}, defaults, options);

            //remove overflown class from the overlay to enable content scrolling
            if (objThis.settings.appearance.overflown_overlay) {
                this.html.removeClass('overflown');
            }

            //fade out the popup window and reset the input
            this.popup.obj.fadeOut(settings.fade_duration, function () {
                //reset input from fields and only clear right/wrong status on inputs in validation function
                objThis.ResetInput({clear_status_only: true});

                //reset status messages
                objThis.StatusClear();
            });

            //hide button
            this.button.obj.removeClass('hide');

            //change hidden variable to true
            this.settings.status.popup_hidden = true;

            //callback from obj settings
            if (objThis.settings.callbacks.onHide.function && $.isFunction(objThis.settings.callbacks.onHide.function)) {
                objThis.settings.callbacks.onHide.function.apply(objThis.settings.callbacks.onHide.this, [$.extend(true, {}, this, objThis.settings.callbacks.onHide.parameters)]);
            }
        },

        CollapsePopupBodyToggle: function (options) {
            //set settings
            var objThis = this;
            var defaults = {
                slide_duration: 300,
                action: 'toggle',
            };
            var settings = $.extend({}, defaults, options);

            switch (settings.action) {
                case 'toggle':
                    if (this.settings.status.popup_body_collapsed) {
                        //fade in the popup window
                        this.popup.body.slideDown(settings.slide_duration);

                        //change hidden variable to false
                        this.settings.status.popup_body_collapsed = false;
                    } else {
                        //fade in the popup window
                        this.popup.body.slideUp(settings.slide_duration);

                        //change hidden variable to false
                        this.settings.status.popup_body_collapsed = true;
                    }
                    break;
                case 'show':
                    //fade in the popup window
                    this.popup.body.slideDown(settings.slide_duration);

                    //change hidden variable to false
                    this.settings.status.popup_body_collapsed = false;
                    break;
                case 'hide':
                    //fade in the popup window
                    this.popup.body.slideUp(settings.slide_duration);

                    //change hidden variable to false
                    this.settings.status.popup_body_collapsed = true;
                    break;
                default:
                    break;
            }
        },

        DisableButton: function (input) {
            this.settings.status.button_disabled = !!input;
        },

        /* ------ Input ------ */

        /**
         * @return {{is_valid: boolean, field: *}}
         */
        ValidateField: function (_field, options) {
            var defaults = {};
            var settings = $.extend({}, defaults, options);

            var field = _field;
            var $this = field.obj;

            //return value. If all inputs are correctly validated, the value will remain true. If one fails, it switches to false
            var is_valid = true;

            /* --- Validation --- */

            //special validation for select and checbkox
            //checkbox
            if (field.type === 'checkbox') {
                if (field.required === true) {
                    if (!$this.prop('checked')) {
                        is_valid = false;
                    }
                }
            }

            //select
            //todo: select validate field
            else if (field.type === 'select') {

            }
            //rest (textfields)
            else {
                if (field.required === true || $this.val() !== '') {
                    //define regex for field types
                    var regex_table = this.settings.input.regex_table;

                    if (field.data_field_type && field.data_field_type in regex_table) {
                        var regex = regex_table[field.data_field_type];
                        if (!regex.test($this.val())) {
                            is_valid = false;
                        }
                    } else {
                        is_valid = false;
                    }
                }
            }

            return {is_valid: is_valid, field: field};
        },

        /**
         * @return {boolean}
         */
        ValidateForm: function (_fields, options) {
            var defaults = {
                append_status: true,
                focus_first_wrong: true,
                fade_duration: 300,
                clear_status_only: false
            };
            var settings = $.extend({}, defaults, options);

            var fields = _fields;

            //return value. If all inputs are correctly validated, the value will remain true. If one fails, it switches to false
            var is_valid = true;

            /* --- Validation --- */

            //wrong inputs collection
            var wrong_inputs = []; // {obj: null, message: null}

            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                var field_valid = this.ValidateField(field);

                var $this = field.obj;
                var $this_container = $this.closest('.input');

                //find and remove old status
                var old_obj = $this_container.find('.' + form_obj_prefix + 'status');

                //if appending new status, delete the old status immediately. Otherwise, fade it out slowly
                if (settings.append_status) {
                    old_obj.remove();
                } else {
                    old_obj.fadeOut(settings.fade_duration, function () {
                        old_obj.remove();
                    });
                }

                if (settings.clear_status_only) {
                    $this.removeClass('correct-input');
                    $this_container.removeClass('correct-input');
                    $this.removeClass('wrong-input');
                    $this_container.removeClass('wrong-input');
                } else {
                    if (field_valid.is_valid) {
                        $this.removeClass('wrong-input');
                        $this_container.removeClass('wrong-input');
                        $this.addClass('correct-input');
                        $this_container.addClass('correct-input');
                    } else {
                        $this.removeClass('correct-input');
                        $this_container.removeClass('correct-input');
                        $this.addClass('wrong-input');
                        $this_container.addClass('wrong-input');

                        wrong_inputs.push({field: field, message: ''});

                        //add element signifying wrong input
                        if (settings.append_status) {
                            var $wrong_input_obj = $('<span class="' + form_obj_prefix + 'status"></span>');
                            $wrong_input_obj.text(this.settings.text_vars.wrong_input_text);
                            $wrong_input_obj.hide();

                            $wrong_input_obj.appendTo($this_container);

                            $wrong_input_obj.fadeIn(settings.fade_duration);
                        }

                        is_valid = false;
                    }
                }
            }

            if (settings.focus_first_wrong && wrong_inputs.length > 0) {
                //sort by position in DOM
                wrong_inputs = this.objSortByPositionInDOM(wrong_inputs, 'field', 'obj');

                //focus first object in DOM
                wrong_inputs[0].field.obj.focus();
            }

            //xxx

            /* --- /Validation --- */

            return is_valid;
        },

        SendDataReturn: function (options) {
            var defaults = {
                reset_input: true,
                message: '',
                style: '',
            };
            var settings = $.extend({}, defaults, options);

            if (settings.reset_input) {
                this.ResetInput({clear_status_only: true});
            }
            this.StatusClear();
            this.StatusAdd(settings.message, {style: settings.style});
        },

        ResetInput: function (options) {
            var defaults = {
                clear_status_only: false,
            };
            var settings = $.extend({}, defaults, options);

            var form = this.popup.form;//this.popup.obj.find('form');
            form[0].reset();

            //validate after resetting the form
            this.ValidateForm(this.settings.input.fields, {append_status: false, focus_first_wrong: false, clear_status_only: settings.clear_status_only});
            this.ValidateForm(this.settings.input.agreements, {append_status: false, focus_first_wrong: false, clear_status_only: settings.clear_status_only});

            /*
            var input = form.find(input_all_mask);
            input.filter('[type="text"], [type="tel"], textarea').val('');
            input.filter('[type="checkbox"]').prop('checked', true);
            input.filter('select').prop('selectedIndex',0);
            */

            //this.hideReadmore_all();
        },

        /* ------------------------------ HELPERS ------------------------------- */

        /*
         * Input: Array[]
         * Output: String
         * Function that formats data attributes into a string
         */
        formatData: function (input) {
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
                    if (output[output.length - 1] === ' ') {
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
        formatDynamicAttributes: function (collection) {
            var _collection = collection;
            for (var i = 0; i < _collection.length; i++) {
                var attributes = _collection[i].attributes;
                var formatted = '';

                //format attributes into a string
                for (var x = 0; x < attributes.length; x++) {
                    //open attr
                    formatted += attributes[x].key + '="';
                    //insert attr value
                    formatted += attributes[x].value;
                    //close attr
                    formatted += '" ';
                }

                //remove last space
                if (formatted.length > 0 && formatted[formatted.length - 1] === ' ') {
                    formatted = formatted.slice(0, -1);
                }

                _collection[i].formatted = formatted;
            }

            return _collection;
        },

        /*
         * Sort an array containing DOM elements by their position in the document (top to bottom)
         */
        objSortByPositionInDOM: function (input, attr, attr2) {
            //sort by position in DOM
            var _input = input;
            var output;
            if (attr && attr2) {
                output = _input.sort(function (a, b) {
                    if (a[attr][attr2][0] === b[attr][attr2][0]) return 0;
                    if (!a[attr][attr2][0].compareDocumentPosition) {
                        // support for IE8 and below
                        return a[attr][attr2][0].sourceIndex - b[attr][attr2][0].sourceIndex;
                    }
                    if (a[attr][attr2][0].compareDocumentPosition(b[attr][attr2][0]) & 2) {
                        // b comes before a
                        return 1;
                    }
                    return -1;
                });
            }
            else if (attr) {
                output = _input.sort(function (a, b) {
                    if (a[attr][0] === b[attr][0]) return 0;
                    if (!a[attr][0].compareDocumentPosition) {
                        // support for IE8 and below
                        return a[attr][0].sourceIndex - b[attr][0].sourceIndex;
                    }
                    if (a[attr][0].compareDocumentPosition(b[attr][0]) & 2) {
                        // b comes before a
                        return 1;
                    }
                    return -1;
                });
            } else {
                output = _input.sort(function (a, b) {
                    if (a[0] === b[0]) return 0;
                    if (!a[0].compareDocumentPosition) {
                        // support for IE8 and below
                        return a[0].sourceIndex - b[0].sourceIndex;
                    }
                    if (a[0].compareDocumentPosition(b[0]) & 2) {
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
    };

})(jQuery, window, document);