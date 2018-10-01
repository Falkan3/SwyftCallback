/*
 *  Swyft Callback - v0.2.2
 *  A dynamic callback contact form
 *
 *  Made by Adam Kocić (Falkan3)
 *  Under MIT License
 */
// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function (jQuery, window, document, undefined) {

    "use strict";

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    const pluginName = "swyftCallback",
        pluginNameLower = pluginName.toLowerCase(),
        formObjPrefix = 'sc_',
        formFieldsPrefix = formObjPrefix + 'fld_',
        inputAllMask = 'input, select, textarea',

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
                add_utm_params: false,
                utm_params_dictionary: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'keypartner'],
            },
            //appearance
            appearance: {
                custom_button_class: "",
                custom_button_container_class: "",
                custom_popup_class: "",
                show_check_all_agreements: true,
                overflown_overlay: true,
                ripple_effect: 1, //available: [1, 2]
                show_toggle_button_text: false, // show the text near the toggle button
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

                toggle_button_text: false, // text near the toggle button
            },
            //form info
            novalidate: true,
            input: {
                prefix: formObjPrefix,
                fields: [],
                agreements: [],
                check_all_agreements: {
                    obj: null,
                    short: 'Check all agreements',
                },
                regex_table: {
                    inputmask: {
                        phone: ["###-###-###", "## ###-##-##", "(###)###-####"]
                    },
                    'phone': /(\(?(\+|00)?48\)?([ -]?))?(\d{3}[ -]?\d{3}[ -]?\d{3})|([ -]?\d{2}[ -]?\d{3}[ -]?\d{2}[ -]?\d{2})/,
                    'email': /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                    //^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčśšśžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŚŠŚŽ∂ð ,.'-]+$
                    'name': /^[a-zA-Z\u00E0\u00E1\u00E2\u00E4\u00E3\u00E5\u0105\u010D\u0107\u0119\u00E8\u00E9\u00EA\u00EB\u0117\u012F\u00EC\u00ED\u00EE\u00EF\u0142\u0144\u00F2\u00F3\u00F4\u00F6\u00F5\u00F8\u00F9\u00FA\u00FB\u00FC\u0173\u016B\u00FF\u00FD\u017C\u017A\u00F1\u00E7\u010D\u015B\u0161\u015B\u017E\u00C0\u00C1\u00C2\u00C4\u00C3\u00C5\u0104\u0106\u010C\u0116\u0118\u00C8\u00C9\u00CA\u00CB\u00CC\u00CD\u00CE\u00CF\u012E\u0141\u0143\u00D2\u00D3\u00D4\u00D6\u00D5\u00D8\u00D9\u00DA\u00DB\u00DC\u0172\u016A\u0178\u00DD\u017B\u0179\u00D1\u00DF\u00C7\u0152\u00C6\u010C\u015A\u0160\u015A\u017D\u2202\u00F0 ,.'-]+$/,
                },
                //dictionary is used to exchange input names into values from the dictionary on API request
                data_dictionary: {} //'sc_fld_telephone': 'phone'
            },
            body_content: [],
            templates: {
                input: {
                    field: {
                        obj: null,
                        name: 'phone',
                        field_name: formObjPrefix + 'telephone',
                        label: 'Phone number',
                        type: 'tel',
                        data_field_type: 'phone', //possible types: phone, name, email. Used for regex_table
                        placeholder: '000-000-000',
                        max_length: 20,
                        required: true
                    },
                    agreement: {
                        obj: null,
                        field_name: formObjPrefix + 'agreement',
                        type: 'checkbox',
                        short: 'Lorem',
                        long: 'Ipsum',
                        readmore: 'More',
                        readless: 'Less',
                        required: true,
                        checked: true,
                    },
                },
                body_content: {
                    short: 'Short',
                    long: 'Long',
                    readmore: 'More',
                    readless: 'Less',
                }
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
        this.$element = jQuery(element);

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = jQuery.extend(true, {}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._nameLower = pluginNameLower;
        this._objPrefix = formObjPrefix;
        this._methods = methods;
        this._inputAllMask = inputAllMask;

        //set default vars for the fields in form
        this._methods.setDefaultVars(this);

        //dynamic vars
        this.html = jQuery('html');
        //button used to bring up popup window
        this.button = {
            obj: null
        };
        //popup window
        this.popup = {
            obj: null, form: null, body: null, body_content: null, footer: null
        };

        this._methods.init(this);
    }

    // Avoid Plugin.prototype conflicts
    // jQuery.extend(Plugin.prototype, {
    const methods = {
        //if(jQuery.fn.pluginName) {...} - check for functions from other plugins (dependencies)

        init: function (instance) {

            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.settings
            // you can add more functions like the one below and
            // call them like the example bellow
            instance._methods.initPopup(instance);
            instance._methods.initButton(instance);
        },
        setDefaultVars: function (instance) {
            //set default vars for form fields
            if (instance.settings.input.fields) {
                const template = instance.settings.templates.input.field;
                for (let i = 0; i < instance.settings.input.fields.length; i++) {
                    instance.settings.input.fields[i] = jQuery.extend({}, template, instance.settings.input.fields[i]);
                }
            }

            //set default vars for agreements
            if (instance.settings.input.agreements) {
                const template = instance.settings.templates.input.agreement;
                for (let i = 0; i < instance.settings.input.agreements.length; i++) {
                    instance.settings.input.agreements[i] = jQuery.extend({}, template, instance.settings.input.agreements[i]);
                }
            }

            //set default vars for body_content
            if (instance.settings.body_content) {
                const template = instance.settings.templates.body_content;
                for (let i = 0; i < instance.settings.body_content.length; i++) {
                    instance.settings.body_content[i] = jQuery.extend({}, template, instance.settings.body_content[i]);
                }
            }
        },
        formatClasses: function (input) {
            const _input = input;
            const input_length = _input.length;
            let output = '';
            if (input) {
                output += ' ';

                //is array
                if (input.constructor === Array) {
                    for (let i = 0; i < input_length; i++) {
                        output += _input[i] + ' ';
                    }
                    if (output[output.length - 1] === ' ') {
                        output = output.slice(0, -1);
                    }
                } else {
                    output += _input;
                }
            }

            return output;
        },

        initButton: function (instance) {
            instance._methods.initButtonBody(instance);

            //apply event listeners to elements contained in popup
            instance._methods.buttonAppendEventListeners(instance);
        },

        initButtonBody: function (instance) {
            const buttonClasses = instance._methods.formatClasses(instance.settings.appearance.custom_button_class);
            const data = instance._methods.formatData(instance.settings.data.custom_button_data);

            let rippleClass = 'ripple';
            switch(instance.settings.appearance.ripple_effect) {
                case 2:
                    rippleClass = 'ripple2';
                    break;
            }

            let html = '';

            if(instance.settings.appearance.show_toggle_button_text) {
                const buttonContainerClasses = instance._methods.formatClasses(instance.settings.appearance.custom_button_container_class);
                html = `
                <div class="${instance._objPrefix+ 'tg_btn_container' + buttonContainerClasses}">
                    <p class="${instance._objPrefix}tg_btn_text">${instance.settings.text_vars.toggle_button_text}</p>
                    
                    <div class="${instance._objPrefix + 'tg_btn' + buttonClasses}" ${data}>
                        <div class="${instance._objPrefix}round_container">
                            <div class="${instance._objPrefix}icon">
                                <a href="#" role="button"></a>
                            </div>
                        </div>
                        <div class="${instance._objPrefix + rippleClass}"></div>
                    </div>
                </div>
                `;
            } else {
                html = `
                <div class="${instance._objPrefix + 'tg_btn' + buttonClasses}" ${data}>
                    <div class="${instance._objPrefix}round_container">
                        <div class="${instance._objPrefix}icon">
                            <a href="#" role="button"></a>
                        </div>
                    </div>
                    <div class="${instance._objPrefix + rippleClass}"></div>
                </div>
                `;
            }

            const $buttonBody = jQuery(html);
            instance.button.obj = $buttonBody.appendTo(instance.$element);
        },

        buttonAppendEventListeners: function (instance) {
            //prevent default on popup button trigger click
            instance.button.obj.find('a').on('click', function (e) {
                e.preventDefault();

                instance._methods.TogglePopup(instance);
            });
        },

        /*
         * Builders for popup body
         */
        initPopup_generate_fields: function (instance, popupBody) {
            //form fields
            let fields = '';
            let dynamic_attributes = [];

            if (instance.settings.input.fields) {
                const fields_section = popupBody.find('.' + instance._objPrefix + 'fields_section');

                for (let i = 0; i < instance.settings.input.fields.length; i++) {
                    const field = instance.settings.input.fields[i];

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
                    dynamic_attributes = instance._methods.formatDynamicAttributes(dynamic_attributes);

                    const output = '<div class="' + instance._objPrefix + 'division">\n' +
                        '               <div class="input">\n' +
                        '                   <label for="' + field.field_name + '">' + field.label + '</label>\n' +
                        '                   <input ' + dynamic_attributes[0].formatted + '/>\n' +
                        '               </div>\n' +
                        '             </div>\n';
                    fields += output;

                    //save created DOM object in settings field reference
                    const $obj = jQuery(output).appendTo(fields_section);
                    instance.settings.input.fields[i].obj = $obj.find(instance._inputAllMask).first();
                }
            }

            return fields;
        },
        initPopup_generate_popup_agreements: function (instance, popupBody) {
            const agreements_section = popupBody.find('.' + instance._objPrefix + 'agreements_section');
            let agreements = '';
            let output = '';
            let $obj = null;

            if (instance.settings.input.agreements) {
                //append check all agreements button
                if (instance.settings.appearance.show_check_all_agreements && instance.settings.input.agreements.length > 0) {
                    output = '<div class="' + instance._objPrefix + 'division">\n' +
                        '               <div class="input">\n' +
                        '                   <div class="' + instance._objPrefix + 'checkbox_container">\n' +
                        '                       <input id="' + instance._objPrefix + 'agreement_all" name="' + instance._objPrefix + 'agreement_all" type="checkbox" data-field-type="checkbox" />\n' +
                        '                       <button class="checkmark"></button>\n' +
                        '                   </div>\n' +
                        '\n' +
                        '                   <label for="' + instance._objPrefix + 'agreement_all">' + instance.settings.input.check_all_agreements.short + '</label>\n' +
                        '               </div>\n' +
                        '          </div>';

                    //save created DOM object in settings field reference
                    $obj = jQuery(output).appendTo(agreements_section);
                    instance.settings.input.check_all_agreements.obj = $obj.find(instance._inputAllMask).first();
                }

                for (let i = 0; i < instance.settings.input.agreements.length; i++) {
                    const agreement = instance.settings.input.agreements[i];

                    let dynamic_attributes = [];
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
                    dynamic_attributes = instance._methods.formatDynamicAttributes(dynamic_attributes);

                    // if agreement has no longer version

                    if (typeof agreement.long === 'undefined' || agreement.long === '') {
                        output = '<div class="' + instance._objPrefix + 'division">' +
                            '           <div class="input">' +
                            '               <div class="' + instance._objPrefix + 'checkbox_container">\n' +
                            '                   <input ' + dynamic_attributes[0].formatted + ' />\n' +
                            '                   <button class="checkmark"></button>\n' +
                            '               </div>\n' +
                            '\n' +
                            '               <label for="' + agreement.field_name + '">' + agreement.short + '</label>\n' +
                            '           </div>' +
                            '         </div>';
                    } else {
                        output = '<div class="' + instance._objPrefix + 'division">' +
                            '           <div class="input">' +
                            '               <div class="' + instance._objPrefix + 'checkbox_container">\n' +
                            '                   <input ' + dynamic_attributes[0].formatted + ' />\n' +
                            '                   <button class="checkmark"></button>\n' +
                            '               </div>\n' +
                            '\n' +
                            '               <label for="' + agreement.field_name + '">' + agreement.short + ' <button class="' + instance._objPrefix + 'readmore">' + agreement.readmore + '</button></label>\n' +
                            '               <div class="' + instance._objPrefix + 'readmore_body" style="display: none;">\n' +
                            '                   <span>' + agreement.long + '</span>\n' +
                            '                   <button class="' + instance._objPrefix + 'readmore">' + agreement.readless + '</button>\n' +
                            '               </div>' +
                            '           </div>' +
                            '         </div>';
                    }

                    agreements += output;

                    //save created DOM object in settings field reference
                    $obj = jQuery(output).appendTo(agreements_section);
                    instance.settings.input.agreements[i].obj = $obj.find(instance._inputAllMask).first();
                }
            }

            return agreements;
        },
        initPopup_generate_popup_body_content: function (instance) {
            const body_content_section = instance.popup.body_content; //popupBody.find('.' + instance._objPrefix + 'body_content_section');
            let body_content_items = '';
            let output = '';
            let $obj = null;

            if (instance.settings.body_content) {
                for (let i = 0; i < instance.settings.body_content.length; i++) {
                    const body_content_item = instance.settings.body_content[i];

                    if (typeof body_content_item.long === 'undefined' || body_content_item.long === '') {
                        output = '<div class="' + instance._objPrefix + 'division">\n' +
                            '         <p>' + body_content_item.short + '</p>\n' +
                            '    </div>';
                    } else {
                        output = '<div class="' + instance._objPrefix + 'division">\n' +
                            '         <p>' + body_content_item.short + ' <button class="' + instance._objPrefix + 'readmore">' + body_content_item.readmore + '</button></p>\n' +
                            '         <div class="' + instance._objPrefix + 'readmore_body" style="display: none;">\n' +
                            '             <span>' + body_content_item.long + '</span>\n' +
                            '             <button class="' + instance._objPrefix + 'readmore">' + body_content_item.readless + '</button>\n' +
                            '         </div>\n' +
                            '    </div>';
                    }

                    body_content_items += output;

                    //save created DOM object in settings field reference
                    $obj = jQuery(output).prependTo(body_content_section);
                    instance.settings.body_content[i].obj = $obj;
                }
            }

            return body_content_items;
        },
        initPopup_generate_popup_body: function (instance) {
            let dynamic_attributes = [];

            // generate attributes for popup body
            const classes = instance._methods.formatClasses(instance.settings.appearance.custom_popup_class);
            dynamic_attributes = [
                //0
                {
                    name: 'form',
                    attributes: [
                        {key: 'action', value: instance.settings.api.url},
                        {key: 'method', value: instance.settings.data.form_method},
                        {key: 'novalidate', value: instance.settings.novalidate},
                    ],
                    formatted: ''
                },
            ];
            dynamic_attributes = instance._methods.formatDynamicAttributes(dynamic_attributes);

            const overlay = '<div class="' + instance._objPrefix + 'overlay" style="display: none;">';
            const popupBody =
                '<div class="' + instance._objPrefix + 'popup_container">\n' +
                '    <div class="' + instance._objPrefix + 'popup' + classes + '">\n' +
                '        <button class="' + instance._objPrefix + 'btn_close" type="button"></button>\n' +
                '        <div class="' + instance._objPrefix + 'title_section">\n' +
                '            <p>' + instance.settings.text_vars.popup_title + '</p>\n' +
                '        </div>\n' +
                '\n' +
                '        <div class="' + instance._objPrefix + 'body_section">\n' +
                '            <p>' + instance.settings.text_vars.popup_body + '</p>\n' +
                '            <form ' + dynamic_attributes[0].formatted + '>\n' +
                '                <div class="container-fluid no-padding">\n' +
                '                    <div class="row">\n' +
                '                        <div class="col-xs-12 ' + instance._objPrefix + 'fields_section">\n' +
                //fields +
                '                        </div>\n' +
                '\n' +
                '                        <div class="col-xs-12">\n' +
                '                            <div class="' + instance._objPrefix + 'division">\n' +
                '                                <button type="submit" class="' + instance._objPrefix + 'btn btn_submit">' + instance.settings.text_vars.send_button_text + '</button>\n' +
                '                            </div>\n' +
                '                        </div>\n' +
                '                    </div>\n' +
                '\n' +
                '                    <div class="row ' + instance._objPrefix + 'agreements">\n' +
                '                        <div class="col-xs-12 ' + instance._objPrefix + 'agreements_section">\n' +
                //agreements +
                '                        </div>\n' +
                '                    </div>\n' +
                '                </div>\n' +
                '            </form>\n' +
                '            <div class="' + instance._objPrefix + 'body_content_section"></div>\n' +
                '        </div>\n' +
                '\n' +
                '        <div class="' + instance._objPrefix + 'footer_section">\n' +
                '\n' +
                '        </div>\n' +
                '    </div>\n' +
                '</div>';

            const $html = jQuery(overlay).append(jQuery(popupBody));

            return $html;
        },

        /*
         * Main function for initializing popup body
         */
        initPopup: function (instance) {
            //body
            const $popupBody = jQuery(instance._methods.initPopup_generate_popup_body(instance));

            //append the object to DOM
            instance.popup.overlay = $popupBody.appendTo(instance.$element);

            //find references to sections
            instance.popup.obj = instance.popup.overlay.find('.' + instance._objPrefix + 'popup');
            instance.popup.form = instance.popup.obj.find('form');
            instance.popup.body = instance.popup.obj.find('.' + instance._objPrefix + 'body_section');
            instance.popup.agreements = instance.popup.obj.find('.' + instance._objPrefix + 'agreements_section');
            instance.popup.body_content = instance.popup.obj.find('.' + instance._objPrefix + 'body_content_section');
            instance.popup.footer = instance.popup.obj.find('.' + instance._objPrefix + 'footer_section');

            //form fields
            //add fields to popup body
            //let fields =
            instance._methods.initPopup_generate_fields(instance, $popupBody);

            //agreements
            //add agreements to popup body
            //let agreements =
            instance._methods.initPopup_generate_popup_agreements(instance, $popupBody);

            //footer
            instance._methods.initPopup_generate_popup_body_content(instance);

            //apply event listeners to elements contained in popup
            instance._methods.popupAppendEventListeners(instance);

            //apply miscellaneous plugins
            instance._methods.popupApplyMisc(instance);
        },

        /*
         * Append event listeners for clickable elements in popup window
         */
        popupAppendEventListeners: function (instance) {
            //hide popup on outside click
            instance.popup.overlay.on('click', function() {
                instance._methods.HidePopup(instance);
            });

            //stop propagation on popup click
            instance.popup.obj.on('click', function(e) {
                e.stopPropagation();
            });

            //checkbox click
            instance.popup.form.find('.checkmark').on('click', function (e) {
                e.preventDefault();
                const input = jQuery(this).siblings('input');
                const is_checked = input.prop('checked');
                input.prop('checked', !is_checked).trigger('change', []);
            });

            //readmore click
            instance.popup.obj.find('.' + instance._objPrefix + 'readmore').on('click', function (e) {
                e.preventDefault();
                instance._methods.showReadmore(instance, this);
            });

            //close click
            instance.popup.obj.find('.' + instance._objPrefix + 'btn_close').on('click', function (e) {
                e.preventDefault();
                instance._methods.HidePopup(instance);
            });

            //form input blur / input
            for (let i = 0; i < instance.settings.input.fields.length; i++) {
                const field = instance.settings.input.fields[i];
                field.obj.data('index', i);
                field.obj.on('input', function (e) {
                    const index = jQuery(this).data('index');
                    //validate input
                    const validated = instance._methods.ValidateForm(instance, [instance.settings.input.fields[index]], {append_status: false, focus_first_wrong: false});
                    //send form if validated
                    if (validated) {
                        console.log('validation successful');
                    }

                    return false;
                });
            }

            //form agreement blur / input
            for (let i = 0; i < instance.settings.input.agreements.length; i++) {
                const agreement = instance.settings.input.agreements[i];
                agreement.obj.data('index', i);
                agreement.obj.on('change', function (e, _no_check_all_status) {
                    const index = jQuery(this).data('index');
                    //validate input
                    const validated = instance._methods.ValidateForm(instance, [instance.settings.input.agreements[index]], {append_status: false, focus_first_wrong: false});
                    //send form if validated
                    if (validated) {
                        console.log('validation successful');
                    }

                    if (!_no_check_all_status) {
                        //change the check prop of check all button according to the status of all agreements
                        instance._methods.input_checkbox_check_all_status(instance);
                    }

                    return false;
                });
            }

            //checkbox check all click
            if (instance.settings.appearance.show_check_all_agreements) {
                instance.settings.input.check_all_agreements.obj.on('change', function (e, _no_check_all_status) {
                    if (!_no_check_all_status) {
                        const is_checked = jQuery(this).prop('checked');

                        //change checked status on all agreements to the prop of check all button
                        for (let i = 0; i < instance.settings.input.agreements.length; i++) {
                            instance.settings.input.agreements[i].obj.prop('checked', is_checked).trigger('change', [true]);
                        }
                    }
                });
            }

            //change the check prop of check all button according to the status of all agreements
            instance._methods.input_checkbox_check_all_status(instance);

            //form submit
            instance.popup.form.on('submit', function (e) {
                const status = instance._methods.SendData(instance, {
                    callback: {
                        success: {
                            function: instance._methods.SendDataReturn,
                            this: instance,
                            parameters: [instance, {reset_input: true, message: instance.settings.text_vars.status_success, style: 'success'}]
                        },
                        error: {
                            function: instance._methods.SendDataReturn,
                            this: instance,
                            parameters: [instance, {reset_input: false, message: instance.settings.text_vars.status_error, style: 'error'}]
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
        showReadmore: function (instance, obj) {
            const $this = jQuery(obj);
            $this.closest('.' + instance._objPrefix + 'division').find('.' + instance._objPrefix + 'readmore_body').slideToggle();
        },
        /*
         * Readmore hide all readmore sections
         */
        hideReadmore_all: function (instance) {
            const agreements = instance.input.agreements;
            for(const key in agreements) {
                if(agreements.hasOwnProperty(key)) {
                    // return the default (initial) value of checkbox
                    agreements[key].obj.prop('checked', agreements[key].checked);
                    agreements[key].obj.closest('.' + instance._objPrefix + 'division').find('.' + instance._objPrefix + 'readmore_body').slideToggle();
                }
            }
        },

        /*
         * Apply miscellaneous plugins (ie. input mask)
         */
        popupApplyMisc: function (instance) {
            /* --- js input mask --- */
            const inputs = instance.popup.form.find(instance._inputAllMask);

            //check if exists
            console.log('js input mask: ' + (typeof jQuery.fn.inputmask !== 'undefined'));
            if (typeof jQuery.fn.inputmask !== 'undefined') {
                const input_masked_items = inputs.filter('input[type="tel"], .jsm_phone');
                const phones_mask = instance.settings.input.regex_table.inputmask.phone; //["###-###-###", "## ###-##-##", "(###)###-####"];

                console.log('js input mask || masked items: ');
                console.log(input_masked_items);

                input_masked_items.inputmask({
                    mask: phones_mask,
                    greedy: false,
                    definitions: {'#': {validator: "[0-9]", cardinality: 1}},
                    'autoUnmask': true
                });
            }
            /* --- /js input mask --- */
        },

        /*
         * Change the check prop of check all button according to the status of all agreements
         */
        input_checkbox_check_all_status: function (instance) {
            if (instance.settings.appearance.show_check_all_agreements) {
                let all_checked = true;

                for (let i = 0; i < instance.settings.input.agreements.length; i++) {
                    if (!instance.settings.input.agreements[i].obj.prop('checked')) {
                        all_checked = false;
                    }
                }

                instance.settings.input.check_all_agreements.obj.prop('checked', all_checked).trigger('change', [true]);
            }
        },

        /* -------------------- PUBLIC METHODS -------------------- */

        /* ------ Form data ------ */

        /**
         * @return {boolean}
         */
        SendData: function (instance, options) {
            let status = {success: false, message: 'SendData: Error (Default)'};

            const defaults = {
                url: instance.settings.api.url,
                api_custom: instance.settings.api.custom,
                data: instance.popup.form.serialize(),
                data_dictionary: instance.settings.input.data_dictionary,
                type: instance.settings.data.form_method,
                success_param: instance.settings.api.param.success, //bool - true for success, false for failure
                return_param: instance.settings.api.param.message, //the key of returned data (preferably an array) from the API which contains the response
                status_sending_text: instance.settings.text_vars.status_sending,
                send_headers: instance.settings.data.send_headers
            };
            const settings = jQuery.extend(true, {}, defaults, options);

            //remove all status messages
            instance._methods.StatusClear(instance);

            //find all input in form
            //const input = instance.popup.form.find(instance._inputAllMask);

            //validate input
            const validated_fields = instance._methods.ValidateForm(instance, instance.settings.input.fields);
            const validated_agreements = instance._methods.ValidateForm(instance, instance.settings.input.agreements);
            const validated = validated_fields && validated_agreements;

            //send form if validated
            if (validated) {
                console.log('Validation successful');
                console.log('Attempting to send data...');

                //set message showing that data is being sent
                instance._methods.StatusClear(instance);
                instance._methods.StatusAdd(instance, settings.status_sending_text, {});

                //Add utm params to api custom data
                if (instance.settings.data.add_utm_params) {
                    const unique_utm_params = instance._methods.ArrayGetDistinct(settings.api_custom, instance._methods.URLGetUTMs(instance.settings.data.utm_params_dictionary), ['name']);

                    settings.api_custom = jQuery.merge(settings.api_custom, unique_utm_params);
                }

                status = instance._methods.SendDataAjax(instance, settings);
            } else {
                status = {success: false, message: 'SendData: Error (Validation)'};
            }

            return status;
        },
        SendDataAjax: function (instance, options) {
            let status = {success: false, message: 'SendDataAjax: Error (Default)'};

            //set settings
            const defaults = {
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
            const settings = jQuery.extend(true, {}, defaults, options);

            //extend data from form with custom data
            if (settings.api_custom) {
                const api_custom_length = settings.api_custom.length;
                let custom_data_string = '';

                if (settings.data.length > 0) {
                    custom_data_string += '&';
                }

                for (let i = 0; i < api_custom_length; i++) {
                    custom_data_string += settings.api_custom[i].name + '=' + settings.api_custom[i].value;

                    if (i < api_custom_length - 1) {
                        custom_data_string += '&';
                    }
                }

                settings.data += encodeURI(custom_data_string);
            }

            //use a custom dictionary specific to API to convert key names to the valid values
            const data_dictionary_keys = Object.keys(settings.data_dictionary);
            for (let i = 0; i < data_dictionary_keys.length; i++) {
                const regex = settings.data_dictionary[data_dictionary_keys[i]];
                console.log(data_dictionary_keys[i] + ' > ' + regex);
                //use regex to replace form field names into those specified in the dictionary
                settings.data = settings.data.replace(data_dictionary_keys[i], regex);
            }

            console.log(settings);

            //AJAX CALL

            //if no ajax call is currently processing
            if (instance.settings.status.ajax_processing) {
                status = {success: false, message: 'SendDataAjax: Error (Processing...)'};
            } else {
                instance.settings.status.ajax_processing = true;
                status = {success: true, message: 'SendDataAjax: Success (Got into ajax)'};

                //Configure
                if (settings.send_headers) {
                    jQuery.ajaxSetup({
                        headers: {
                            //'X-CSRF-TOKEN': jQuery('meta[name="csrf-token"]').attr('content'),
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                }

                jQuery.ajax({
                    url: settings.url,
                    type: settings.type,
                    data: settings.data,
                    enctype: 'multipart/form-data',
                    dataType: 'json',
                    processData: false,
                    success: function (data) {
                        let response_success = false;
                        let return_message;

                        console.log(data);

                        if (data[settings.return_param]) {
                            if (jQuery.isArray(data[settings.return_param]) || (data[settings.return_param] !== null && typeof data[settings.return_param] === 'object')) {
                                for (let index in data[settings.return_param]) {
                                    console.log(data[settings.return_param][index]);
                                }
                            }

                            //Show message from API
                            console.log('API status: ' + data.status);
                            console.log('API message: ');
                            console.log(data[settings.return_param]);
                        }

                        //format return message
                        if (jQuery.isArray(data[settings.return_param])) {
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
                            if (settings.callback.success.function && jQuery.isFunction(settings.callback.success.function)) {
                                //call the callback function after the function is done
                                settings.callback.success.function.apply(settings.callback.success.this, settings.callback.success.parameters);
                            }
                            //callback from obj settings
                            if (instance.settings.callbacks.onSend.success.function && jQuery.isFunction(instance.settings.callbacks.onSend.success.function)) {
                                instance.settings.callbacks.onSend.success.function.apply(instance.settings.callbacks.onSend.success.this, [jQuery.extend(true, {}, data, instance.settings.callbacks.onSend.success.parameters)]);
                            }
                        } else {
                            //CALLBACK
                            //ERROR
                            //check if callback is set and is a function
                            if (settings.callback.error.function && jQuery.isFunction(settings.callback.error.function)) {
                                //call the callback function after the function is done
                                settings.callback.error.function.apply(settings.callback.error.this, settings.callback.error.parameters);
                            }
                            //callback from obj settings
                            if (instance.settings.callbacks.onSend.error.function && jQuery.isFunction(instance.settings.callbacks.onSend.error.function)) {
                                instance.settings.callbacks.onSend.error.function.apply(instance.settings.callbacks.onSend.error.this, [jQuery.extend(true, {}, data, instance.settings.callbacks.onSend.error.parameters)]);
                            }

                            //if show response from api settings is set to true, view the message
                            if (instance.settings.status.response_from_api_visible && return_message) {
                                instance._methods.StatusAdd(instance, return_message, {style: 'error'});
                            }
                        }

                        instance.settings.status.ajax_processing = false;
                    },
                    error: function (data) {
                        // Error...
                        console.log('API status: ' + data.status);
                        console.log('API message: ');
                        console.log(data[settings.return_param]);

                        status = {success: false, message: 'Error (API x:0)'};

                        instance.settings.status.ajax_processing = false;

                        //CALLBACK

                        //ERROR
                        //check if callback is set and is a function
                        if (settings.callback.error.function && jQuery.isFunction(settings.callback.error.function)) {
                            //call the callback function after the function is done
                            settings.callback.error.function.apply(settings.callback.error.this, settings.callback.error.parameters);
                        }
                        if (instance.settings.callbacks.onSend.error.function && jQuery.isFunction(instance.settings.callbacks.onSend.error.function)) {
                            instance.settings.callbacks.onSend.error.function.apply(instance.settings.callbacks.onSend.error.this, instance.settings.callbacks.onSend.error.parameters);
                        }
                    }
                });
            }

            return status;
        },

        /* Status messages */

        StatusAdd: function (instance, _message, options) {
            //set settings
            const defaults = {
                fade_duration: 300,
                style: ''
            };
            const settings = jQuery.extend({}, defaults, options);

            /* --- */

            let message = jQuery('<p></p>');
            message.text(_message);
            message.appendTo(instance.popup.footer);
            message.hide();

            if (settings.style === 'success') {
                instance._methods.StatusClearStyle(instance);
                instance.popup.footer.addClass('success');
            } else if (settings.style === 'error') {
                instance._methods.StatusClearStyle(instance);
                instance.popup.footer.addClass('error');
            }

            message.fadeIn(settings.fade_duration);
        },
        StatusClearStyle: function (instance) {
            //reset css classes
            instance.popup.footer.removeClass('success error');
        },
        StatusClear: function (instance) {
            instance._methods.StatusClearStyle(instance);
            //remove contents
            instance.popup.footer.empty();
        },

        /* ------ Popup ------ */

        TogglePopup: function (instance, options) {
            if (instance.settings.status.button_disabled) {
                return;
            }

            if (instance.settings.status.popup_hidden) {
                instance._methods.ShowPopup(instance, options);
            } else {
                instance._methods.HidePopup(instance, options);
            }
        },

        ShowPopup: function (instance, options) {
            if (instance.settings.status.button_disabled) {
                return;
            }

            //set settings
            const defaults = {
                fade_duration: 300,
            };
            const settings = jQuery.extend({}, defaults, options);

            //add overflown class to the overlay to disable content scrolling
            if (instance.settings.appearance.overflown_overlay) {
                instance.html.addClass('overflown');
            }

            //fade in the popup window
            instance.popup.overlay.fadeIn(settings.fade_duration);

            //focus first input in popup form
            instance.popup.form.find(instance._inputAllMask).first().focus();

            //hide button
            instance.button.obj.addClass('hide');

            //change hidden variable to false
            instance.settings.status.popup_hidden = false;

            //callback from obj settings
            if (instance.settings.callbacks.onShow.function && jQuery.isFunction(instance.settings.callbacks.onShow.function)) {
                instance.settings.callbacks.onShow.function.apply(instance.settings.callbacks.onShow.this, [jQuery.extend(true, {}, instance, instance.settings.callbacks.onShow.parameters)]);
            }
        },

        HidePopup: function (instance, options) {
            if (instance.settings.status.button_disabled) {
                return;
            }

            //set settings
            const defaults = {
                fade_duration: 300,
            };
            const settings = jQuery.extend({}, defaults, options);

            //remove overflown class from the overlay to enable content scrolling
            if (instance.settings.appearance.overflown_overlay) {
                instance.html.removeClass('overflown');
            }

            //fade out the popup window and reset the input
            instance.popup.overlay.fadeOut(settings.fade_duration, function () {
                //reset input from fields and only clear right/wrong status on inputs in validation function
                instance._methods.ResetInput(instance, {clear_status_only: true});

                //reset status messages
                instance._methods.StatusClear(instance);
            });

            //hide button
            instance.button.obj.removeClass('hide');

            //change hidden variable to true
            instance.settings.status.popup_hidden = true;

            //callback from obj settings
            if (instance.settings.callbacks.onHide.function && jQuery.isFunction(instance.settings.callbacks.onHide.function)) {
                instance.settings.callbacks.onHide.function.apply(instance.settings.callbacks.onHide.this, [jQuery.extend(true, {}, instance, instance.settings.callbacks.onHide.parameters)]);
            }
        },

        CollapsePopupBodyToggle: function (instance, options) {
            //set settings
            const defaults = {
                slide_duration: 300,
                action: 'toggle',
            };
            const settings = jQuery.extend({}, defaults, options);

            switch (settings.action) {
                case 'toggle':
                    if (instance.settings.status.popup_body_collapsed) {
                        //fade in the popup window
                        instance.popup.body.slideDown(settings.slide_duration);

                        //change hidden variable to false
                        instance.settings.status.popup_body_collapsed = false;
                    } else {
                        //fade in the popup window
                        instance.popup.body.slideUp(settings.slide_duration);

                        //change hidden variable to false
                        instance.settings.status.popup_body_collapsed = true;
                    }
                    break;
                case 'show':
                    //fade in the popup window
                    instance.popup.body.slideDown(settings.slide_duration);

                    //change hidden variable to false
                    instance.settings.status.popup_body_collapsed = false;
                    break;
                case 'hide':
                    //fade in the popup window
                    instance.popup.body.slideUp(settings.slide_duration);

                    //change hidden variable to false
                    instance.settings.status.popup_body_collapsed = true;
                    break;
                default:
                    break;
            }
        },

        DisableButton: function (instance, input) {
            instance.settings.status.button_disabled = !!input;
        },

        /* ------ Input ------ */

        /**
         * @return {{is_valid: boolean, field: *}}
         */
        ValidateField: function (instance, _field, options) {
            const defaults = {};
            const settings = jQuery.extend({}, defaults, options);

            const field = _field;
            const $this = field.obj;

            //return value. If all inputs are correctly validated, the value will remain true. If one fails, it switches to false
            let is_valid = true;

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
                    const regex_table = instance.settings.input.regex_table;

                    if (field.data_field_type && field.data_field_type in regex_table) {
                        const regex = regex_table[field.data_field_type];
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
        ValidateForm: function (instance, _fields, options) {
            const defaults = {
                append_status: true,
                focus_first_wrong: true,
                fade_duration: 300,
                clear_status_only: false
            };
            const settings = jQuery.extend({}, defaults, options);

            const fields = _fields;

            //return value. If all inputs are correctly validated, the value will remain true. If one fails, it switches to false
            let is_valid = true;

            /* --- Validation --- */

            //wrong inputs collection
            let wrong_inputs = []; // {obj: null, message: null}

            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                const field_valid = instance._methods.ValidateField(instance, field);

                const $this = field.obj;
                const $this_container = $this.closest('.input');

                //find and remove old status
                const old_obj = $this_container.find('.' + instance._objPrefix + 'status');

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
                            const $wrong_input_obj = jQuery('<span class="' + instance._objPrefix + 'status"></span>');
                            $wrong_input_obj.text(instance.settings.text_vars.wrong_input_text);
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
                wrong_inputs = instance._methods.objSortByPositionInDOM(wrong_inputs, 'field', 'obj');

                //focus first object in DOM
                wrong_inputs[0].field.obj.focus();
            }

            //xxx

            /* --- /Validation --- */

            return is_valid;
        },

        SendDataReturn: function (instance, options) {
            const defaults = {
                reset_input: true,
                message: '',
                style: '',
            };
            const settings = jQuery.extend({}, defaults, options);

            if (settings.reset_input) {
                instance._methods.ResetInput(instance, {clear_status_only: true});
            }
            instance._methods.StatusClear(instance);
            instance._methods.StatusAdd(instance, settings.message, {style: settings.style});
        },

        ResetInput: function (instance, options) {
            const defaults = {
                clear_status_only: false,
            };
            const settings = jQuery.extend({}, defaults, options);

            const form = instance.popup.form; // this.popup.obj.find('form');
            form[0].reset();

            //validate after resetting the form
            instance._methods.ValidateForm(instance, instance.settings.input.fields, {append_status: false, focus_first_wrong: false, clear_status_only: settings.clear_status_only});
            instance._methods.ValidateForm(instance, instance.settings.input.agreements, {append_status: false, focus_first_wrong: false, clear_status_only: settings.clear_status_only});

            /*
            const input = form.find(instance._inputAllMask);
            input.filter('[type="text"], [type="tel"], textarea').val('');
            input.filter('[type="checkbox"]').prop('checked', true);
            input.filter('select').prop('selectedIndex',0);
            */

            //this.hideReadmore_all(instance);
        },

        /* ------------------------------ HELPERS ------------------------------- */

        /*
         * Input: Array[]
         * Output: String
         * Function that formats data attributes into a string
         */
        formatData: function (input) {
            const _input = input;
            const input_length = _input.length;
            let output = '';
            if (_input) {
                output += ' ';

                //is array
                if (input.constructor === Array) {
                    for (let i = 0; i < input_length; i++) {
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
            const _collection = collection;
            for (let i = 0; i < _collection.length; i++) {
                const attributes = _collection[i].attributes;
                let formatted = '';

                //format attributes into a string
                for (let x = 0; x < attributes.length; x++) {
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
         * Input: String (optional)
         * Output: Object / Undefined
         * Function that returns GET paramters from the given url (window url default)
         * To retrieve a parameter, get the value of the paramter from the returned object (response['utm_source'])
         */
        URLGetParams: function (url) {
            if (typeof url === 'undefined') {
                url = window.location.href;
            }

            let request = {};
            const qIndex = url.indexOf('?');
            if (qIndex === -1) {
                return undefined;
            }
            const pairs = url.substring(qIndex + 1).split('&');
            for (let i = 0; i < pairs.length; i++) {
                if (!pairs[i])
                    continue;
                const pair = pairs[i].split('=');
                request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            }
            return request;
        },

        /*
         * Input: Array
         * Output: Object
         * Function that grabs utm parameters (according to dictionary in settings.data) and returns them from the url
         * To retrieve a parameter, get the value of the paramter from the returned object (response['utm_source'])
         */
        URLGetUTMs: function (utm_params_dictionary) {
            const url_params = this.URLGetParams();
            let utm_params = []; //{name: '', value: ''}

            for (const key in url_params) {
                //check if key exists and it is a valid utm param from the settings
                if (url_params.hasOwnProperty(key) && (utm_params_dictionary.indexOf(key) > -1)) {
                    utm_params.push({name: key, value: url_params[key]});
                }
            }

            return utm_params;
        },

        /*
         * Input: Array [{name: 'utm_source'}], Array [{name: 'utm_source'}, {name: 'test'}], Array ['name']
         * Output: Array Array [{name: 'test'}]
         * Remove duplicate entries in the second Array based on the values in the first array. Both arrays contain objects with the structure {key:value}
         * Return the second array with removed items.
         */
        ArrayGetDistinct: function (array_1, array_2, param_names) {
            let unique_dictionary = {};
            let distinct = [];

            for (const param in param_names) {
                if(param_names.hasOwnProperty(param)) {
                    for (const key in array_1) {
                        if (array_1.hasOwnProperty(key) && array_1[key].hasOwnProperty(param_names[param])) {
                            if (!unique_dictionary.hasOwnProperty(param_names[param])) {
                                unique_dictionary[param_names[param]] = [];
                            }
                            unique_dictionary[param_names[param]].push(array_1[key][param_names[param]]);
                        }
                    }
                }
            }

            for (const param in param_names) {
                if(param_names.hasOwnProperty(param)) {
                    for (const key in array_2) {
                        if (array_2.hasOwnProperty(key) && array_2[key].hasOwnProperty(param_names[param])) {
                            if (unique_dictionary[param_names[param]].indexOf(array_2[key][param_names[param]]) === -1) {
                                distinct.push(array_2[key]);
                            }
                        }
                    }
                }
            }

            return distinct;
        },

        /*
         * Sort an array containing DOM elements by their position in the document (top to bottom)
         */
        objSortByPositionInDOM: function (input, attr, attr2) {
            //sort by position in DOM
            const _input = input;
            let output;
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
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations

    // default outside method call: pluginInstance._methods.nameOfAnInnerFunction(pluginInstance, arg1, arg2...);
    jQuery.fn[pluginName] = function (options) {
        let instances = [];

        this.each(function () {
            if (!jQuery.data(this, "plugin_" + pluginName)) {
                const instance = new Plugin(this, options);
                jQuery.data(this, "plugin_" +
                    pluginName, instance);
                instances.push(instance);
            }

            // Make it possible to access methods from public.
            // e.g `$element.plugin('method');`
            if (typeof options === 'string') {
                const args = Array.prototype.slice.call(arguments, 1);
                data[options].apply(data, args);
            }
        });

        if (instances.length === 1) {
            return instances[0];
        }

        return null
    };

})(jQuery, window, document);