This is work in progress towards a simple and stripped down dark theme for
`hieroglyph <http://hieroglyph.io>`__.

It is based on the theme ``slides2`` of `hieroglyph <http://hieroglyph.io>`__,
which, in turn, is based on the updated Google (~2013) I/O HTML slides
template.

Why didn't we inherit from the ``slides2`` theme, you ask? Because
a) the "parent" themes are not really under active development, so the
maintenance overhead to adopt changes is probably low (none);
b) we would have had to replace some files, which would have led to code
duplication anyway;
c) since we have to duplicate code, we can take the opportunity and do
a complete fork in order to clean up what we do not want.

keyboard shortcuts
==================

Not sure if they all work (#todo), but if found those keys wired up in
the source code:

right arrow, down arrow, page up, space
  next slide

left arrow, up arrow, page down, backspace
  previous slide

O
  toggle overview (currently broken – needs CSS fixes)

P
  speaker notes in presenter view (currently broken – needs CSS fixes)

ESC
  hide notes

F
  toggle fullscreen

presenter view
--------------

.. warning::
  The presenter view is currently broken but it "just" needs some CSS
  fixes.

The slides contain a presenter mode feature (beta) to view + control
the slides from a popup window.

To **enable** presenter mode, add ``presentme=true`` to the URL:

  http://localhost:8000/template.html?presentme=true

To **disable** presenter mode, hit:

  http://localhost:8000/template.html?presentme=false

Presenter mode is sticky, so refreshing the page will persist your
settings.
