const HtmlWebpackPlugin = require("html-webpack-plugin")
const { stripIndent } = require('common-tags')

class GoogleTagManagerPlugin {

  constructor(options) {

    const userOptions = options || {};
    const optionalArguments = ``;
    const defaultOptions = {
      id: '',
      events: '',
      dataLayer: '',
      dataLayerName: '',
      auth: '',
      preview: ''
    }

    this.options = Object.assign(defaultOptions, userOptions);

    if (!userOptions.id) {
      console.error(`The plugin option "id" has not been set.`)
    }

    if(userOptions.auth && userOptions.preview) {
      optionalArguments = `&gtm_auth=${userOptions.auth}&gtm_preview=${userOptions.preview}&gtm_cookies_win=x`;
    }

    this.snippets = {
      script: stripIndent`
        <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js',${JSON.stringify(this.options.events).slice(1, -1)}});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl+ '${optionalArguments}';f.parentNode.insertBefore(j,f);
        })(window,document,'script','${this.options.dataLayerName}','${this.options.id}');</script>
        <!-- End Google Tag Manager -->
      `,
      noScript: stripIndent`
        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${this.options.id}${optionalArguments}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->
      `,
      dataLayer: (() => {
        let result = `window.${this.options.dataLayerName}=window.${this.options.dataLayerName}||[];`
        if (this.options.dataLayer) {
          if (typeof this.options.dataLayer === `object` || this.options.dataLayer instanceof Object) {
            result += `window.${this.options.dataLayerName}.push(${JSON.stringify(
              this.options.dataLayer
            )});`
          } else {
            console.error(
              `The plugin option "dataLayer" should be a plain object. "${this.options.dataLayer}" is not valid.`
            )
          }
        }
        return stripIndent`${result}`
      })()
    }
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('GoogleTagManagerPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        'GoogleTagManagerPlugin', (htmlPlugin, callback) => {
          const headRegExp = /(<\/head>)/i
          const bodyRegExp = /(<body\s*>)/i
          const injectHtml = (html) => {
            if (this.options.dataLayer)
              html = html.replace(headRegExp, match => this.snippets.dataLayer + match)
            html = html.replace(headRegExp, match => this.snippets.script + match)
            html = html.replace(bodyRegExp, match => match + this.snippets.noScript)
            return html
          }
          htmlPlugin.html = injectHtml(htmlPlugin.html)
          callback(null, htmlPlugin)
        }
      )
    })
  }

}

module.exports = GoogleTagManagerPlugin
