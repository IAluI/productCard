function ShopsetCookie(_1, _2, _3, _4, _5, _6) {
    document.cookie = _1 + "=" + escape(_2) + ((_3) ? "; expires=" + _3 : "") + ((_4) ? "; path=" + _4 : "") + ((_5) ? "; domain=" + _5 : "") + ((_6) ? "; secure" : "");
}

function ChangeFilterGoods(obj, k, description, value) {
    if (obj.checked) {
        document.getElementById('input' + k).value = document.getElementById('input' + k).value + ';;' + description + '|' + value;
    } else {
        document.getElementById('input' + k).value = document.getElementById('input' + k).value.replace(';;' + description + '|' + value, '');
    }
}

function ShowFilterGoods(c, k) {
    var data = '?c=' + c;
    var counter = 0;
    for (var i = 1; i < k; i++) {
        data = data + '&elem' + i + '=' + document.getElementById('input' + i).value;
        if (document.getElementById('input' + i).value != '') counter++;
    }
    if (counter != 0) window.location.href = './' + data; else window.location.href = '?c=' + c;
}

function ShopNumberFormat(number, decimals, dec_point, thousands_sep) {
    number = (number + '')
        .replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + (Math.round(n * k) / k)
                .toFixed(prec);
        };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
        .split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '')
        .length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1)
            .join('0');
    }
    return s.join(dec);
}

function ChangeGoods(obj) {
    $('#buy_btn_cont').html('<img src="/images/ajax.gif" />');
    $(obj).parents('div.values').children('span.item').removeClass('selected');
    $(obj).addClass('selected');
    var SelectData = {};
    $("#shop_goods .features").find(".values").each(function (i) {
        if ($(this).attr('data-desc-id') !== undefined && $(this).attr('data-attr-var') === undefined) {
            if ($(this).children('.selected').length) SelectData[$(this).attr('data-desc-id')] = $(this).find('.selected').text();
            else if ($(this).children('span').length == 1) SelectData[$(this).attr('data-desc-id')] = $(this).find('span').text();
        }
    });

    var GoodsId = $("#shop_goods input[name=goods_id]").val();
    //alert('123');
    $.ajax({
        type: "POST",
        url: "/shop/ajax_goods.php",
        data: {
            action: 'get_goods_param',
            goods_id: GoodsId,
            desc_id: $(obj).parents('div.values').attr('data-desc-id'),
            data: SelectData
        }
    })
        .done(function (msg) {
            //alert(msg);
            //$('.tab-0').text(msg);
            if (msg == 'error') {
                alert('Ошибка обновления данных о товаре. Попробуйте позже.');
            } else {
                var obj_msg = jQuery.parseJSON(msg);
                $("#shop_goods form input[name=goods_id]").val(obj_msg.id);

                // цена товара
                if (typeof (obj_msg.discount) != 'undefined' && obj_msg.discount > 0 && typeof (obj_msg.discount_type) != 'undefined' && obj_msg.discount_type == '1') {
                    obj_msg.price = obj_msg.price * (100 - obj_msg.discount) / 100;
                }
                $("#shop_goods .price").text('' + ShopNumberFormat(obj_msg.price, 0, ',', ' ') + ' руб.');
                if ($("#shop_goods .old-price").length) {
                    if (typeof (obj_msg.discount) != 'undefined' && obj_msg.discount > 0) {
                        var oldPrice = obj_msg.price / (100 - obj_msg.discount) * 100;
                        $("#shop_goods .old-price").html('' + ShopNumberFormat(oldPrice, 0, ',', ' ') + ' руб.');
                    } else {
                        $("#shop_goods .old-price").html();
                    }
                }
                /*if (obj_msg.articul)
                    {
                    $("#shop_goods div.right div.item").last().html('<div class="title"><div>Артикул:</div></div><div class="values"><span>'+obj_msg.articul+'</span></div>');
                    }
                else
                    {
                    $("#shop_goods div.right div.item").last().html("");
                    }*/

                if (obj_msg.discount != '0' && obj_msg.discount !== null) {
                    $("#shop_goods span.info").html("– " + obj_msg.discount + " %");
                } else if (obj_msg.good_of_day != "0000-00-00") {
                    $("#shop_goods span.info").html("Товар дня");
                } else if (obj_msg.hit_of_sales != "0") {
                    $("#shop_goods span.info").html("Хит продаж");
                } else {
                    $("#shop_goods span.info").html("");
                }

                obj_msg.values.forEach(function (item) {
                    html_values = '';
                    ip_len = item.possible.length;
                    for (i = 0; i < ip_len; i++) {
                        /* заплатка для целых чисел */
                        shown_desc_item = item.possible[i];
                        if (shown_desc_item.charAt(0) == '0' && shown_desc_item.charAt(1) != ',') shown_desc_item = shown_desc_item.substr(1);
                        /* конец заплатки для целых чисел */
                        if (item.description_id == 1 && item.possible[i].indexOf('|') != -1) {
                            // заплатка для цвета
                            var colors = item.possible[i].split('|');
                            html_values += '<span title="' + colors[0] + '" class="item' + (item.value == item.possible[i] ? ' selected' : '') + ' color"' + (ip_len > 1 ? ' onclick="ChangeGoods(this);"' : '') + '><div style="background-image: url(\'/uploaded/images/shop/colors/' + colors[1].replace(/\s+/g, '') + '.gif\');"></div><p>' + colors[0] + '</p><p class="hide">|' + colors[1] + '</p></span>';
                        }
                        // В строчке ниже  || item.description_id == 3 || item.description_id == 7 - заплатка, т.к. нужно, чтобы длина и толщина всегда была бы в квадратиках
                        else html_values += '<span' + (ip_len > 1 /*|| item.description_id == 3 || item.description_id == 7 */ ? ' class="item' + (item.value == item.possible[i] ? ' selected' : '') + '"' : '') + (ip_len > 1 || item.description_id == 3 || item.description_id == 7 ? ' onclick="ChangeGoods(this);"' : '') + '>' + (shown_desc_item != item.possible[i] ? '<p class="hide0">0</p>' : '') + shown_desc_item + '</span>';
                    }
                    $("#shop_goods .values[data-desc-id='" + item.description_id + "']").html(html_values);
                });
                if (obj_msg.visible == '1') {
                    if (obj_msg.qt == false) {
                        $('#buy_btn_cont').html('<input type="submit" value="Купить" class="goodsFeatures-button_c"/>');
                    } else {
                        $('#buy_btn_cont').html('<a href="/shop/cart/" class="button">Добавлено в корзину</a>');
                    }
                    $("#shop_goods .hide").removeClass('hide');
                } else {
                    $('#buy_btn_cont').html('<p>Недоступен для заказа.</p>');
                    $("#shop_goods .price-label").addClass('hide');
                    $("#shop_goods .price").addClass('hide');
                }

                // меняем картинки
                window.GlobalGalleryIndex = 0;
                var num = 0;
                var SmallHTML = '';
                if (obj_msg.img.length + obj_msg.media.length > 0) {
                    obj_msg.img.forEach(function (item) {
                        if (SmallHTML == '') {
                            $('#current_img').attr('src', '/kernel/preview.php?file=shop/goods/' + item + '.jpg&width=400&height=300');
                        }
                        SmallHTML += '<a class="fancybox" href="/uploaded/images/shop/goods/' + item + '.jpg" rel="gallery-group" alt=""></a>';
                        if (obj_msg.img.length + obj_msg.media.length > 1) SmallHTML += '<img data-num="' + num + '" src="/kernel/preview.php?file=shop/goods/' + item + '.jpg&width=130&height=130" onclick="ReplaceGalleryIMG(this);" class="">';
                        num++;
                    });
                    obj_msg.media.forEach(function (item) {
                        if (SmallHTML == '') {
                            $('#current_img').attr('src', '/kernel/preview.php?file=shop/media/' + item['media_id'] + '.jpg&width=400&height=300');
                        }
                        SmallHTML += '<a class="fancybox" data-fancybox-type="iframe" href="' + item['url'] + '" rel="gallery-group" alt=""></a>';
                        if (obj_msg.img.length + obj_msg.media.length > 1) SmallHTML += '<img data-num="' + num + '" data-type="media" src="/kernel/preview.php?file=shop/media/' + item['media_id'] + '.jpg&width=93&height=70" onclick="ReplaceGalleryIMG(this);" class="">';
                        num++;
                    });
                    $('#zoom').show();
                } else {
                    $('#current_img').attr('src', '/kernel/preview.php?file=shop/goods/nophoto.jpg&width=400&height=300');
                    $('#zoom').hide();
                }
                $('.goods-card .gallery .small').html(SmallHTML);

                // скидки от количества
                if ($('#shop_goods .qt_discounts').length) {
                    $("#shop_goods input[name=base_price]").val(obj_msg.price);
                    $("#qt_discounts_json").html(JSON.stringify(obj_msg.qt_discounts));
                    var DiscountsText = '';
                    obj_msg.qt_discounts.forEach(function (DiscItem) {
                        if (DiscountsText == '') DiscountsText = 'Скидки от количества:';
                        DiscountsText += '<br/>- от ' + DiscItem['qt'] + ' шт. &mdash; ' + (DiscItem['discount'] !== undefined ? DiscItem['discount'].replace(".", ",") + '%' : ShopNumberFormat(DiscItem['price'], 0, '', ' ') + ' руб.')
                    });
                    $("#shop_goods .qt_discounts .text").html(DiscountsText);
                    // изменяем базовую цену в зависимости от скидки от количества
                    var CurrentPrice = getCurrentPrice(obj_msg.qt, obj_msg.price, obj_msg.qt_discounts);
                    if (CurrentPrice !== false) {
                        $("#shop_goods .change_kol .price").text('' + ShopNumberFormat(CurrentPrice, 0, '', ' '));
                    }
                }
                // завершение кода (скидки от количества)
            }
        })
        .fail(function (msg) {
            alert('Ошибка обновления данных о товаре. Код ошибки: '.msg);
            $('#buy_btn_cont').html('<input type="submit" value="Купить" class="goodsFeatures-button_c"/>');
        });
}


jQuery(function ($) {

    var len = document.getElementsByClassName('goodsFigures-item_c').length;
    if (len == 2) len++;
    $("div.goodsFigures-item_c").attr("style", "min-width:100px; height:100px;");
    $("#shop_goods span.item").bind("click", function () {
        ChangeGoods(this);
    });

    $("#goods_desc .tabs li").bind("click", function () {
        $("#goods_desc .tabs li").removeClass('current');
        index = $(this).attr("class").substr(4);
        $(this).addClass('current');
        $("#goods_desc .content").removeClass('current');
        $("#goods_desc .tab-" + index).addClass('current');
    });

    $("#shopping_cart_table input").bind("change keyup", function () {
        // считаем скидки от количества и подитог для каждого товара
        var subTotal = parseFloat('0.00');
        var goodsPrice = 0; // цена товара с учетом всех скидок на товар
        if ($(".qt_discounts_json").length) {
            // считаем цену товара с учетом скидок от количества
            var qtDiscounts = jQuery.parseJSON($(this).parents('td').children('.qt_discounts_json').html());
            var goodsPriceMax = parseFloat($(this).attr('data-max-price'));     // максимальная цена на товар без каких либо скидок
            var goodsPriceMin = parseFloat($(this).attr('data-min-price'));     // цена на товар, с учетом всех скидок, кроме скидок от количества
            var goodsPriceBase = parseFloat($(this).attr('data-base-price'));   // цена на товар, указанная в БД сайта
            goodsPrice = getCurrentPrice($(this).val(), goodsPriceBase, qtDiscounts);
            if (goodsPrice > goodsPriceMin) {
                goodsPrice = goodsPriceMin;
            }
            subTotal = goodsPrice * $(this).val();
            $(this).parents('tr').children('.price').text(ShopNumberFormat(goodsPrice, 0, ',', ' '));
        } else {
            goodsPrice = parseFloat($(this).parents('tr').children('.price').text().replace(' ', '').replace(',', '.'));
            subTotal = goodsPrice * $(this).val();
        }
        $(this).parents('tr').children('.sum').text(ShopNumberFormat(subTotal, 0, ',', ' '));

        // считаем итоговую сумму корзины и сумму скидки
        $.ajax({
            type: "POST",
            url: "/shop/ajax_cart.php",
            data: {action: 'buy', goods_id: $(this).attr('name').substr(6), qt: $(this).val()}
        })
            .done(function (msg) {
                var json = jQuery.parseJSON(msg);
                // выводим результат расчета суммы корзины и скидок
                $("#cart_sum").html(ShopNumberFormat(json.sum, 0, ',', ' '));
                if ($("#cart_sum_discount").length) {
                    $("#cart_sum_discount").html(ShopNumberFormat(json.discount_sum, 0, ',', ' '));
                }
                RefreshCart();
                if (typeof reCountMinOrderAmount == 'function') {
                    reCountMinOrderAmount();
                }
                $.ajax({
                    type: "post",
                    url: "/shop/cart/trace/getPurchases.php"
                })
                    .done(function (msg) {
                        get_new_events(0, msg);
                    });
            });
    });

    // клик по плюсу на витрине товаров
    $(".goods a.incr").bind("click", function () {
        var inputObj = $(this).parents('.qt').find('input');
        inputObj.val(inputObj.val() * 1.0 + 1.0);
        $(this).parents('.goods').removeClass('in-cart');
        $(this).parents('.goods').find('.buttons').append('<input class="buy" value="Купить" onclick="AddToCartFromGoodsList(this);" />');
        $(this).parents('.goods').find('a.buy').remove();
        return false;
    });

    // клик по минусу на витрине товаров
    $(".goods a.decr").bind("click", function () {
        var inputObj = $(this).parents('.qt').find('input');
        if (inputObj.val() * 1.0 > 0) {
            inputObj.val(inputObj.val() * 1.0 - 1.0);
            $(this).parents('.goods').find('.buttons').append('<input class="buy" value="Купить" onclick="AddToCartFromGoodsList(this);" />');
            $(this).parents('.goods').find('a.buy').remove();
        }
        return false;
    });

    
});

// клик по корзине на витрине товаров
function AddToCartFromGoodsList(obj) {
    var inputObj = $(obj).parents('.goods').find('input');
    var GoodsId = inputObj.attr('name').substr(10);
    var Qt = inputObj.val() * 1.0;
    if (Qt == 0) {
        inputObj.val(1);
        Qt = 1;
    }
    AddToCart(GoodsId, Qt);
    $(obj).parents('.goods').addClass('in-cart');
    $(obj).parents('.goods').find('.buttons').append('<a href="/shop/cart/" class="buy">В корзине</a>');
    $(obj).remove();
    return false;
}


function AddToCart(GoodsId, Qt) {
   
    if (GoodsId === undefined) $('#buy_btn_cont').html('<img src="/images/ajax.gif" />');
    
    // меняем цену в зависимости от скидок от количества
    if ($('#shop_goods .qt_discounts').length) {
        var CurrentPrice = getCurrentPrice(Qt);
        if (CurrentPrice !== false) {
            $("#shop_goods .change_kol .price").text('' + ShopNumberFormat(CurrentPrice, 0, '', ' '));
        }
    }
    $.ajax({
        type: "POST",
        url: "/shop/ajax_cart.php",
        data: {
            action: 'buy',
            goods_id: (GoodsId === undefined ? $("input[name=goods_id]").val() : GoodsId),
            qt: (Qt === undefined ? 1 : Qt)
        }
    })
        .done(function (msg) {
            if (msg == 'error') {
                alert('Ошибка при покупке товара. Попробуйте позже.');
            } else {
                RefreshCart();
                //  document.location.href = '/shop/cart/';
                if ($("input[name=qt]").val() != 0) $('#buy_btn_cont').html('<a href="/shop/cart/" class="button">В корзине</a>');
            }
            if (GoodsId === undefined) {
                if ($("input[name=qt]").val() == 0) $('#buy_btn_cont').html('<input type="submit" value="Купить"/>');
                /*else  $('#buy_btn_cont').html('<a href="/shop/cart/" class="button">В корзине</a>');*/
            }
        });
}

function RefreshCart() {
    $.ajax({
        type: "GET",
        url: "/shop/cart.php?ajax"
    })
        .done(function (msg) {
            $('.cartEmpty_m').remove();
            $('.cart_m').remove();
            $('#cart').append(msg);
            //OnScrollWindow();
        });
}

function SwitchView(ViewType) {
    var _d = new Date();
    _d.setTime(_d.getTime() + (30 * 24 * 60 * 60 * 1000));
    ShopsetCookie("ViewType", ViewType, _d.toGMTString(), "/");
    location.reload();
}

function ShowSum() {
    $(".buttons div.summ").html(ShopNumberFormat($("input[name=price]").val() * $("input[name=qt]").val(), 0, '', ' ') + ' руб.');
}

function dostavka(mode, obj) {
    var pay = document.getElementById('cart_sum').innerHTML;
    pay = pay.replace(/[^,0-9]/gim, '')
    pay = pay.replace(/\,/, ".");
    switch (mode) {
        case 'kurier':
            //if (pay<1000.00) $(obj).parent().next().html("<div>Стоимость доставки 200 руб.</div>");
            //if ((pay>=1000.00) && (pay<=3000.00) ) $(obj).parent().next().html("<div>Стоимость доставки 200 руб.</div>");
            //if (pay>3000.00) $(obj).parent().next().html("<div>Бесплатная доставка</div>");
            $(obj).parent().next().html("<div>Стоимость доставки 0 руб.</div>");
            change_btn_value_cart(obj, 'Оформить заказ', '1');
            $(obj).parent().parent().next().children('.radio').html('<input type="radio" name="spos_oplat" value="2" checked onclick="change_btn_value_cart(this,\'Оформить заказ\',\'0\');" id="r1"><label for="r1">наличными курьеру при получении товара</label><br/><input type="radio" name="spos_oplat" value="3" onclick="change_btn_value_cart(this,\'Оформить заказ и перейти к оплате\',\'0\');" id="r2"><label for="r2">предоплата онлайн (через платежную систему)</label>');
            break;
        case 'sam':
            $(obj).parent().next().html("<div>Бесплатно</div>");
            change_btn_value_cart(obj, 'Оформить заказ', '1');
            $(obj).parent().parent().next().children('.radio').html('<input type="radio" name="spos_oplat" value="1" checked onclick="change_btn_value_cart(this,\'Оформить заказ\',\'0\');" id="r3"><label for="r3">при получении товара в магазине</label><br/><input type="radio" name="spos_oplat" value="3" onclick="change_btn_value_cart(this,\'Оформить заказ и перейти к оплате\',\'0\');" id="r4"><label for="r4">предоплата онлайн (через платежную систему)</label>');
            break;
        /*case 'pochta':
            $(obj).parent().next().html("<div>Стоимость доставки 500 руб.</div>");
            change_btn_value_cart(obj,'Отправить заказ','1');
            $(obj).parent().parent().next().children('.radio').html('<input type="radio" name="spos_oplat" value="4" checked onclick="change_btn_value_cart(this,\'Отправить заказ\',\'0\');" id="r5"><label for="r5">наложенным платежом Почты России при получении товара</label><br/><input type="radio" name="spos_oplat" value="3" onclick="change_btn_value_cart(this,\'Отправить заказ и перейти к оплате\',\'0\');" id="r6"><label for="r6">онлайн (через платежную систему)</label>');
            break;*/
    }
}

function change_btn_value_cart(obj, text, mode) {
    if (mode == '1') $(obj).parent().parent().next().next().children().val(text); else $(obj).parent().parent().next().children().val(text);
}

/**
 * получение элентов формы
 * @param form
 * @returns {any[]}
 */
function getFieldsFromForm(form) {
    var arr = Array.prototype.map.call(form, function (field) {
        var rel = '0';
        var relObj = $(field).attr("rel");
        if (relObj !== undefined) {
            rel = relObj;
        }
        return {
            name: field.name,
            value: field.value,
            type: field.type,
            rel: rel,
            tag: field.tagName
        };
    });

    for (var key in arr) {
        var name = arr[key].name;
        if (name.substring(0, 5) === "goods") {
            delete arr[key];
        }
    }

    return arr;
}

/**
 * валидация формы заказа
 * @returns {boolean}
 */
function check_cart_form() {
    var formObj = $("form.formCard");
    var submitObj = $("form div.submit").first("div.submit");
    var flag = true;
    $(submitObj).html('<img src="/images/ajax.gif" />');
    var formFields = getFieldsFromForm(formObj[0]);
    formFields.forEach(function (elem) {
        if (typeof elem.value != 'undefined' && elem.value.trim() === "" && elem.rel === "1") {
            UnisiterSetError($("input[name=" + elem.name + "]"), 'Заполните это поле');
            flag = false;
        }
        if (typeof elem.name != 'undefined' && elem.name === "mail" && elem.rel === "1" && UnisiterIsValidEmail(elem.value.trim()) === false) {
            UnisiterSetError($("input[name=" + elem.name + "]"), 'Заполните это поле');
            flag = false;
        }
    });
    if (flag === false) {
        $(submitObj).html('<input type="submit" value="Отправить заказ">');
    } else {
        // автоподмена e-mail
        if ($("input[name=mail]").length > 0 && $("input[name=mail]").attr('rel') === "0" && $("input[name=phone]").length > 0) {
            if ($("input[name=mail]").val() == "" && $("input[name=phone]").val() != "") {
                $("input[name=mail]").css("color", "white");
                $("input[name=mail]").val($("input[name=phone]").val() + '@user.unisiter.ru');
            }
        }
        // автоподмена имени
        if ($("input[name=login]").length > 0 && $("input[name=login]").attr('rel') === "0" && $("input[name=phone]").length > 0) {
            if (flag === true && $("input[name=login]").val() == "" && $("input[name=phone]").val() != "") {
                $("input[name=login]").css("color", "white");
                $("input[name=login]").val('Аноним ' + $("input[name=phone]").val());
            }
        }
    }
    return flag;
}

function show_hide_main_photo(obj) {
    elem = $(obj).parent().parent().parent().prev();
    if ($(obj).prop("checked")) elem.addClass("hidden"); else elem.removeClass("hidden");
}

function change_status(obj, status, id) {
    $(obj).attr('disabled', 'true');
    $.ajax(
        {
            type: "POST",
            url: "/shop/admin/orders/trace/",
            data: "id=" + id + "&status=" + status,
            success: function (response) {
                if (status != 5) $(obj).removeAttr('disabled');
            }
        });
}


GlobalGalleryIndex = 0;

function ReplaceGalleryIMG(obj) {
    var StrSRC = obj.src;
    $('.small img.selected').removeClass('selected');
    document.getElementById("current_img").src = StrSRC.substr(0, StrSRC.lastIndexOf(".")) + '.jpg&width=400&height=300';
    // window.GlobalGalleryIndex = parseInt(StrSRC.substr(StrSRC.lastIndexOf(".")-1,1))-1;
    //2019.06.25 индекс для картинки берется из массива картинок товара
    var img = $('img[data-num]');
    var index = 0;
    img.each(function (key, value) {
        if(value == obj) {
            index = key;
        }
    });
    window.GlobalGalleryIndex = index;
    $(obj).addClass('selected');
    if ($(obj).attr('data-type') == 'media') $.fancybox.open($('.fancybox'), {index: window.GlobalGalleryIndex});
}

jQuery(function ($) {
    $(".sorting select").bind('change', function () {
        $(this).prop('disabled', 'disabled');
        $.ajax({
            type: "GET",
            url: "/shop/ajax_sorting.php",
            data: {sorting: $(this).val()}
        })
            .done(function (msg) {
                location.reload();
            });
    });
});

// возвращает цену в зависимости от количества в корзине и скидок от количества
function getCurrentPrice(Qt, Price, Discounts) {
    if (Discounts === undefined) {
        if ($("#qt_discounts_json").length) {
            Discounts = jQuery.parseJSON($("#qt_discounts_json").html());
        } else {
            return false;
        }
    }
    if (Price === undefined) {
        if ($("#shop_goods input[name=base_price]").length) {
            Price = parseFloat($("#shop_goods input[name=base_price]").val());
        } else {
            return false;
        }
    }
    var CurrentPrice = Price;
    Discounts.forEach(function (DiscItem) {
        if (Qt >= parseFloat(DiscItem['qt'])) {
            if (DiscItem['price'] !== undefined) {
                CurrentPrice = parseFloat(DiscItem['price']);
            } else {
                CurrentPrice = Math.round(Price * (100 - parseFloat(DiscItem['discount']))) / 100;
            }
        }
    });
    return CurrentPrice;
}

jQuery(function ($) {
    $(document).on('change', "#is_ways_of fieldset input[type=radio]", function () {
        var value = this.getAttribute('id');
        var sposopl = this.closest(".spos_opl");
        var hints = $(sposopl).children(".hint")[0];
        $(hints).children().hide();
        $(hints).children("div[data-purchase-hint='" + value + "']").show();
        var is_ways_of = $('#is_ways_of .spos_opl');
        var ind = is_ways_of.index(sposopl);
        $.ajax({
            type: "post",
            url: "/shop/cart/trace/index.php",
            data: {type: value}
        })
            .done(function (msg) {
                is_ways_of.eq(ind).nextAll('div').remove();
                is_ways_of.eq(ind).after(msg);
                get_new_events(ind + 1);
            });
    });
});

function get_new_events(i, msg) {
    var cart_fieldsrt = $("#is_ways_of");
    var is_ways_of = $('#is_ways_of .spos_opl')[i];
    if (cart_fieldsrt !== 'undefined'
        && typeof (is_ways_of) !== 'undefined'
        && is_ways_of !== 'undefined'
        && is_ways_of !== ''
        && is_ways_of !== undefined
    ) {
        var is_checked_elem = $(is_ways_of).find('fieldset input[type=radio]')[0];
        var value = is_checked_elem.getAttribute('id');
        var sposopl = $(is_checked_elem).closest(".spos_opl");
        var ind = $(is_ways_of).index(sposopl);
        $.ajax({
            type: "post",
            url: "/shop/cart/trace/index.php",
            data: {type: value}
        })
            .done(function (msg) {
                $(is_ways_of).eq(ind).nextAll('div').remove();
                $(is_ways_of).eq(ind).after(msg);
                i++;
                get_new_events(i);
                updateCartDelivery();
            });
    }

    if (i === 0 && msg !== undefined) {
        $(cart_fieldsrt).html();
        $(cart_fieldsrt).html(msg);
        get_new_events(0);
    }

    return true;
}

$(document).ready(function () {
    if ($('#is_ways_of').length > 0) {
        $.ajax({
            type: "post",
            url: "/shop/cart/trace/getPurchases.php"
        })
            .done(function (msg) {
                get_new_events(0, msg);
            });
    }


});


jQuery(function ($) {
    $(document).on('change input', "input[data-media-new=true]", function () {

        var id = $(this).attr("data-media-id");
        id = parseInt(id.replace(/\D+/g, "")) + 1;
        $(this).attr("data-media-new", "false");
        var parent = $(this).parent().parent();
        $(parent).after('<div class="item">\n' +
            '    <div class="title">\n' +
            '        <div>' + id + '-я обложка медиа:</div>\n' +
            '    </div>\n' +
            '    <div class="input image">\n' +
            '        <img src="/kernel/preview.php?file=shop/media/new-' + id + '.jpg&amp;width=150&amp;height=150">\n' +
            '        <input type="file" name="media_imgs[new-' + id + ']" value="new-1">\n' +
            '        <div class="del">\n' +
            '            <input type="checkbox" id="del_media_id_new-' + id + '" name="del_media[new-' + id + ']" value="new-' + id + '">\n' +
            '            <label for="del_media_id_new-' + id + '">удалить</label>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '    <div class="hint">\n' +
            '        <div>\n' +
            '            Выберите файл с фотографией на вашем компьютере\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>' +
            '<div class="item">\n' +
            '    <div class="title">\n' +
            '        <div>' + id + '-я ссылка на медиа:</div>\n' +
            '    </div>\n' +
            '    <div class="input"><input type="url" data-media-new="true" data-media-id="new-' + id + '" name="media_urls[new-' + id + ']" value=""></div>\n' +
            '    <div class="hint">\n' +
            '        <div>\n' +
            '            Укажите url встраиваемого в iFrame кода\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>');
    });
});


/* фильтры */

$(document).ready(function () {
    if ($('#shop_goods .is_filter').length > 0) {
        $('<div class="show_hide_filters" onclick="showHideFilters(true)" data-action="show">Показать фильтры</div>').insertAfter('#shop_goods .nav');
        $('form.filters').addClass('animated');
        if ($('form.filters input[type=checkbox]:checked').length > 0) {
            showHideFilters(false);
        }
    }
});

function showHideFilters(isAnimated) {
    if ($('.show_hide_filters').attr('data-action') == 'show') {
        $('#shop_goods .filters').show();
        if (isAnimated) {
            $('#shop_goods .filters').addClass('bounceInLeft');
        }
        $('.show_hide_filters').html('Скрыть фильтры');
        $('.show_hide_filters').attr('data-action', 'hide');
    } else {
        $('#shop_goods .filters').hide(200);
        if (isAnimated) {
            $('#shop_goods .filters').removeClass('bounceInLeft');
        }
        $('.show_hide_filters').html('Показать фильтры');
        $('.show_hide_filters').attr('data-action', 'show');
    }
}

/* Код для обработки вкладки Характеристки и пункта Все характеристики в карточке товара */

$( document ).ready(function() {
    var li_f = $('.tabs li:contains("Характеристики")');
    var dicrip =  $(li_f).attr('class');
    if ($(li_f).length === 0) {
      $('.all_characteristic').parent().hide();
    } else {
        $('.all_characteristic').anchor({transitionDuration: 500});
    }
    $('.all_characteristic').click(function () {
        $('.tabs li').removeClass('current');
        $('#goods_desc div.content').removeClass('current');
        $(li_f).addClass('current');
        var index = dicrip.replace('nav-', '');
        $('#goods_desc div.tab-' + index).addClass('current');
    });
});

//Заменяет нулевую цену на цену по запросу
$(document).ready(function () {
   $('.goods .price').each(function (index, value) {
       let price = $(value)
                       .clone()
                       .children()
                       .remove()
                       .end()
                       .text();
       if(price == '' || price == 0) {
           $(value).addClass('no-price');
           $(value).text('цена по запросу');
       }
   }) 
});