This is work in progress towards a simple and stripped down dark theme for
`hieroglyph <http://hieroglyph.io>__.

It is based on the theme ``slides2`` of `hieroglyph <http://hieroglyph.io>__,
which, in turn, is based on the updated Google (~2013) I/O HTML slides
template.

Why didn't we inherit from the ``slides2`` theme, you ask? Because
a) we would have had to replace some files, which would have led to code
duplication anyway;
b) the "parent" themes are not really under active development, so the
maintenance overhead to adopt changes is probably low;
d) we have to duplicate code anyway, we can take the opportunity and do
a complete fork in order to clean up what we do not want.

Presenter mode
--------------

The slides contain a presenter mode feature (beta) to view + control
the slides from a popup window.

To enable presenter mode, add ``presentme=true`` to the URL: http://localhost:8000/template.html?presentme=true

To disable presenter mode, hit
http://localhost:8000/template.html?presentme=false

Presenter mode is sticky, so refreshing the page will persist your
settings.
