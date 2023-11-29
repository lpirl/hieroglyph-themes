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

enter, right arrow, down arrow, space
  next build item or, if none, next slide

page down
  next slide, ignore build items

left arrow, up arrow, backspace, page up
  previous slide

home
  first slide

end
  last slide

N
  toggle speaker notes

O
  toggle overview (currently broken – needs CSS fixes)

P
  when pressed in the main window:
  enable & open the presenter window

  when pressed in the presenter window:
  disable & close the presenter window

  when the slides are not opened via ``file://``, the presenter mode
  is sticky, which means that it will re-open after reloading the main window

ESC
  hide notes, close overview

F
  toggle fullscreen

B
  toggle blackout
