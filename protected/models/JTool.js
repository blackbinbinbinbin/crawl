"use strict";

let exportObj = {
    url : '',
    protocol : '',
    origin : '',
    url_relative : '',
    $ : null,
    /**
     * 展开td的colspan
     * @author benzhan
     */
    fixColspan($table) {
        let $ = this.$;
        let $trs = $table.find('tr');
        for (let i = 0; i < $trs.length; i++) {
            let $tr = $($trs[i]);
            let $tds = $tr.find('td[colspan]');
            for (let j = 0; j < $tds.length; j++) {
                let $td = $($tds[j]);
                let span = $td.attr('colspan');
                for (let k = 1; k < span; k++) {
                    $td.after('<td></td>');
                }
                $td.removeAttr('colspan');
            }
        }
    },
    formatDate: function(date) {
        let y, m, d = '01';
        if (typeof date === 'string') {
            let parts = date.match(/[\d]{4}-[\d]{1,2}-[\d]{1,2}/);
            if (parts && parts.length) {
                return parts[0];
            }

            let parts1 = date.match(/([\d]{4})[\s]*年/);
            let parts2 = date.match(/([\d]{1,2})[\s]*月/);
            let parts3 = date.match(/([\d]{1,2})[\s]*日/);
            if ((parts1 && parts1.length || parts3 && parts3.length) && parts2.length ) {
                y = parseInt(parts1[1]);
                m = parseInt(parts2[1]);
                d = parseInt(parts3 && parts3[1]) || 1;
            } else {
                return '';
            }
        } else {
            if (typeof date === 'number') {
                date = new Date(date);
            }

            y = date.getFullYear();
            m = date.getMonth() + 1;
            d = date.getDate();
        }

        m = m < 10 ? '0' + m : m;
        d = d < 10 ? ('0' + d) : d;
        return y + '-' + m + '-' + d;
    },
    formatDateTime: function(date) {
        let dateStr = this.formatDate(date);

        let h, minute, second = '00';
        if (typeof date === 'string') {
            let parts = date.match(/[\d]{1,2}:[\d]{1,2}(:[\d]{1,2})?/);
            if (parts && parts.length) {
                return parts[0];
            }

            let parts1 = date.match(/([\d]{1,2})[\s]*时/);
            let parts2 = date.match(/([\d]{1,2})[\s]*分/);
            let parts3 = date.match(/([\d]{1,2})[\s]*时/);
            if (parts1 && parts1.length && parts2 && parts2.length) {
                h = parseInt(parts1[1]);
                minute = parseInt(parts2[1]);
                second = parseInt(parts3 && parts3[1]) || 0;
            } else {
                return dateStr;
            }
        } else  {
            if (typeof date === 'number') {
                date = new Date(date);
            }

            h = date.getHours();
            second = date.getSeconds();
            minute = date.getMinutes();
        }

        h = h < 10 ? ('0' + h) : h;
        minute = minute < 10 ? ('0' + minute) : minute;
        second = second < 10 ? ('0' + second) : second;
        return dateStr + ' ' + h + ':' + minute + ':' + second;
    },
    initUrl(url) {
        this.url = url;
        let parts = url.match(/(http[s]?:)\/\/[^\/]+[\/]?/);
        this.origin = parts[0];
        this.protocol = parts[1];
        this.url_relative = url.substr(0, url.lastIndexOf('/') + 1);
    },
    initJquery($) {
        this.$ = $;
    },
    formatUrl(href) {
        href = href.trim();
        let origin = this.origin;
        if (/http[s]?:\/\//.test(href)) {
            return href;
        } else if (href.substr(0, 2) === '//') {
            return this.protocol + href;
        } else if (href[0] === '/') {
            if (origin[origin.length - 1] === '/') {
                return origin + href.substr(1);
            } else {
                return origin + href;
            }
        } else {
            return this.url_relative + href;
        }
    },
    formatRichText(content) {
        let $ = this.$;
        let $content = $('<div>' + content.trim() + '</div>');
        $content.find('script').remove();
        $content.find('img').each(function() {
            let formatSrc = exportObj.formatUrl($(this).attr('src'));
            $(this).attr('src', formatSrc);
        });

        $content.find('a').each(function() {
            let href = $(this).attr('href');
            if (href) {
                let formatHref = exportObj.formatUrl(href);
                $(this).attr('href', formatHref);
            }

            $(this).attr('rel', 'nofollow');
        });

        return $content.html();
    }
}

// 兼容老版本
exportObj.formaRichText = exportObj.formatRichText;

module.exports = exportObj;
