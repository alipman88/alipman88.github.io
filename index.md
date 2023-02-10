---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: site
---
<br>I'm a software engineer focused on building technology for public interest. My open-source contributions include [Git](https://github.com/git/git/commits?author=alipman88) and [Ruby on Rails](https://github.com/rails/rails/commits?author=alipman88). I have a strong interest in natural mathematical phenomena, particularly in modeling botany, evolution, and other emergent behaviors through fractals and cellular automata.

This site serves as a repository for various side projects and occasional blog posts:

{% for post in site.posts %}- [{{post.title}}]({{post.url}})
{% endfor %}