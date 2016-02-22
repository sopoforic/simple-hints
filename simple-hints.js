var md = window.markdownit();

$( document ).ready(
    function() {        
        var query = window.location.search.substring(1);
        if (query.substring(0, 4) === "url=") {
            $('#gamebox').find('summary').html("Select another game:");
            loadGame(query.substring(4));
        }
        $.ajax({
            dataType: "json",
            url: 'manifest.json',
            success: function(data) {
                window.manifest = data.manifest;
                var $gamelist = $('#gamelist');
                $.each(window.manifest, function(i, game)
                {
                    var $item = $('<li>');
                    var $link = $('<a>', { href : '#game_'+i });
                    $link.html(game.title);
                    $link.click(function(e) { e.preventDefault(); loadGame(game.url); });
                    $item.html($link);
                    $gamelist.append($item);
                });
            }
        });
    }
);

function loadGame(url) {
    var $hintbox = $('#hintbox');
    $hintbox.html("");
    $.ajax({
        dataType: "json",
        url: url,
        success: function(data) {
            window.data = [
                { th : "Title", td : data.title},
            ];
            if (data.url) {
                window.data.push({ th : "Hints by", td : $('<a>', {href: data.url}).html(data.author)})
            } else {
                window.data.push({ th : "Hints by", td : data.author});
            }
            window.hint_groups = data.hint_groups;
            $('#info').html(makeInfo());
            var $header = $('<h2>');
            $header.html(data.title);
            $hintbox.append("<h2><cite>{0}</cite> hints by {1}</h2>".format(data.title, data.author));
            $.each(window.hint_groups, function(j, group)
            {
                var $group_fieldset = $('<fieldset>', { 'data-group' : j});
                var $group_legend = $('<legend>');
                $group_legend.html(md.renderInline(group.name));
                $group_fieldset.append($group_legend);
                $.each(group.hints, function(i, question)
                {
                    var $details = $('<details>', { 'data-question' : i, 'data-answer' : 0});
                    var $summary = $('<summary>');
                    $summary.html(md.renderInline(question.question));
                    $details.append($summary);
                    
                    var $answer = $('<div>');
                    $answer.html(md.render("{0} (1/{1})".format(question.answers[0], question.answers.length)));
                    $answer.click(function() { nextAnswer($answer) });
                    $details.append($answer);
                    
                    $group_fieldset.append($details);
                });
                $hintbox.append($group_fieldset);
            });
        }
    });
}

function makeInfo() {
    var $t = $('<table>');
    $.each(window.data, function(i, d)
    {
        var $r = $('<tr>');
        $r.append($('<th>').html(d.th));
        $r.append($('<td>').html(d.td));
        $t.append($r);
    });
    return($t);
}

function nextAnswer(answer) {
    var $question = answer.parent('details');
    var group = $question.parent('fieldset').data('group');
    var qid = $question.data('question');
    var q = window.hint_groups[group].hints[qid];
    var next = ($question.data('answer') + 1) % q.answers.length;
    if (next == 0) {
        return;
    }
    $question.data('answer', next);
    var $next_answer = $('<div>');
    $next_answer.click(function() { nextAnswer($next_answer) });
    $next_answer.html(md.render("{0} ({1}/{2})".format(q.answers[next], (next + 1), q.answers.length)))
    $question.append($next_answer);
}

// The following handy function is by gpvos, from an answer on stackoverflow:
// http://stackoverflow.com/questions/1038746/equivalent-of-string-format-in-jquery/5077091#5077091
String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
    if (m == "{{") { return "{"; }
    if (m == "}}") { return "}"; }
    return args[n];
  });
};