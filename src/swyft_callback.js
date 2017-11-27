/*
 *  jquery-boilerplate - v4.0.0
 *  A jump-start for jQuery plugins development.
 *  http://jqueryboilerplate.com
 *
 *  Made by Zeno Rocha
 *  Under MIT License
 */
// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ($, window, document, undefined) {

    //"use strict";

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "swyftCallback",
        defaults = {
            api_url: "test",
            form_method: "post",
            custom_button_class: "",
            custom_button_data: "",
            custom_popup_class: "",
            custom_popup_data: "",
            popup_hidden: true,
            button_disabled: false, //disable show/close functionality
            text_vars: {
                popup_title: "Contact form",
                popup_body: "Leave us your phone number. We'll call you back.",
                send_button_text: "Send",
                input_phone_number_text: "Phone number"
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
        formatClasses(input) {
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
                    if(output[output.length-1] == ' ') {
                        output = output.slice(0, -1);
                    }
                } else {
                    output += _input;
                }
            }

            return output;
        },
        formatData(input) {
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
                    if(output[output.length-1] == ' ') {
                        output = output.slice(0, -1);
                    }
                } else {
                    output += 'data-' + _input;
                }
            }

            return output;
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
            this.button = $buttonBody.appendTo($(this.element));

            $buttonBody.find('a').on('click', function (e) {
                e.preventDefault();

                objThis.TogglePopup();
            });
        },
        initPopup: function () {
            var objThis = this;
            var classes = this.formatClasses(this.settings.custom_popup_class);

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

            var $popupBody = $('<div class="sc_overlay" style="display: none;">\n' +
                '    <div class="sc_popup' + classes + '">\n' +
                '        <div class="sc_btn_close"></div>\n' +
                '        <div class="sc_title_section">\n' +
                '            <p>' + this.settings.text_vars.popup_title + '</p>\n' +
                '        </div>\n' +
                '\n' +
                '        <div class="sc_body_section">\n' +
                '            <form action="' + this.settings.api_url + '" method="' + this.settings.text_vars.form_method + '">\n' +
                '                <div class="container-fluid">\n' +
                '                    <div class="row">\n' +
                '                        <div class="col-xs-12">\n' +
                '                            <div class="sc_division">\n' +
                '                                <label for="sc_fld_telephone">' + this.settings.text_vars.input_phone_number_text + '</label>\n' +
                '                                <input id="sc_fld_" type="tel" placeholder="000-000-000" value="" maxlength="11" />\n' +
                '                            </div>\n' +
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
                '</div>');
            this.popup = $popupBody.appendTo($(this.element));

            //checkbox click
            this.popup.find('.checkmark').on('click', function (e) {
                e.preventDefault();
                var input = $(this).siblings('input');
                input.prop('checked', !input.prop('checked'));
            });

            //readmore click
            this.popup.find('.sc_readmore').on('click', function (e) {
                e.preventDefault();
                objThis.showReadmore(this);
            });

            //close click
            this.popup.find('.sc_btn_close').on('click', function (e) {
                e.preventDefault();
                objThis.ClosePopup();
            });
        },
        TogglePopup: function (options) {
            if (this.settings.button_disabled) {
                return;
            }

            var objThis = this;

            if (this.settings.popup_hidden) {
                this.ShowPopup();
            } else {
                this.ClosePopup();
            }
        },
        ShowPopup: function (options) {
            if (this.settings.button_disabled) {
                return;
            }

            var objThis = this;
            var defaults = {
                fade_duration: 300,
            };
            var settings = $.extend({}, defaults, options);

            this.popup.fadeIn(settings.fade_duration);

            //hide button
            this.button.addClass('hide');
        },
        ClosePopup: function (options) {
            if (this.settings.button_disabled) {
                return;
            }

            var objThis = this;
            var defaults = {
                fade_duration: 300,
            };
            var settings = $.extend({}, defaults, options);

            this.popup.fadeOut(settings.fade_duration, function () {
                objThis.ResetInput()
            });

            //hide button
            this.button.removeClass('hide');
        },
        ResetInput: function () {
            var form = this.popup.find('form');
            var input = form.find('input');
            input.filter('[type="text"], [type="tel"], textarea').val('');
            input.filter('[type="checkbox"]').prop('checked', true);
        },
        showReadmore: function (obj) {
            var $this = $(obj);
            $this.closest('.sc_division').find('.sc_readmore_body').slideToggle();
        },
        DisableButton: function (input) {
            this.settings.button_disabled = !!input;
        }
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

        if(instances.length == 1) {
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