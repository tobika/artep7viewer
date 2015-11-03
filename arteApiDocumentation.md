==Example of api request

http://www.arte.tv/guide/fr/plus7/videos?limit=96&sort=newest

===Parameters

**page=number** 
the json returns a has_more tag, if it's true you can make another request with the page incremented

**limit=number**
the maximum seems to be 100

**sort=string**
know only 'newest' for now

**category=string**

List of known categories:
ACT - Actu & société
CIN - Cinéma
FIC - Séries & fiction
ART - Arts & spectacles classiques
CUL - Culture pop
DEC - Découverte
HIS - Histoire
JUN - Junior


**day=number**
can be from -1 to -4 to get yesterday,...

**cluster=string**
seems to be shortcuts for shows like arte journal, 28 minutes,...