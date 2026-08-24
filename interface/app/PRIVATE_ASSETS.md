# ORBIT Private Assets

Private media does **not** belong in the public repository.

## FRIDAY theme

Local file expected by the app:

`interface/app/private-assets/friday-theme.m4a`

The folder `interface/app/private-assets/` is excluded through `.gitignore`.

Behavior:

1. FRIDAY first tries to play `friday-theme.m4a`.
2. While FRIDAY speaks, the music is ducked automatically.
3. When the voice stops, the music comes back up.
4. If the private file is missing or cannot be played, ORBIT falls back to the built-in synthetic boot ambience.

The spoken content is generated separately by ORBIT in German through the FRIDAY voice system. No speech from the source music is required.
