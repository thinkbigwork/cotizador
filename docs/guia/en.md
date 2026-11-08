# Quoter guide

Everything you need to quote Wizor with no doubts. The figures in this guide come from the current price book (**{{catalogo.version}}**, published {{catalogo.fecha}}) and update on their own when a new one is published.

Internal use, Wizor team only.

## What the quoter is

The tool the team uses to price Wizor for an organization, on the spot and without spreadsheets.

- **`/ventas`** · the quoter. Safe to show the client: it has a **presentation mode** that hides everything internal.
- **`/ventas/comision`** · the seller's commission. Opens in another tab and never appears in the quoter or in this guide.
- **`/admin/catalogo`** · the back office where Wizor changes prices.

**Language.** Every screen is available in Spanish, English and Portuguese. The **ES · EN · PT** selector sits at the top of each one, and your choice applies to the whole site. It also shows in presentation mode, in case the client needs the screen in their language.

## How it works

1. Enter the organization: **activity**, **headcount**, **sites** and **countries**.
2. Choose the **products** and, where applicable, the **devices**.
3. The screen sends that data to the server, which prices it with the current price book and returns the result. The pricing model never travels to the browser.
4. The quoter shows the annual price, the price per person per month, the first year (platform + devices) and how the sale closes:

{{tabla.desenlaces}}

**The price is locked to the price book version.** Every quote and every contract stores the version it was issued with. If prices go up tomorrow, nobody who already signed gets repriced.

## Where the numbers come from

The annual price depends on three things: **activity, headcount and product**.

### 1 · Activity sets a factor

Like an insurer with its premium rate: more risk, higher rate. Wizor Lens does not apply this factor; Core and 360 do.

{{tabla.categorias}}

### 2 · Up to {{autoservicio.max}} people: closed band

The annual price comes from a table by headcount band, multiplied by the product (Lens ×1, Core ×2, 360 ×3) and by the activity factor. These bands have **no** annual minimum.

{{tabla.bandas}}

Table values are before the activity factor.

### 3 · More than {{autoservicio.max}} people: rate per tier

Each person pays the product's base rate, which declines by volume tier. It is **marginal**: each tier pays its own percentage, like income tax, so adding people never makes the price jump.

{{tabla.curvas}}

Annual price = sum of tiers × 12 × activity factor. If the result is below **{{minimo}}**, that annual minimum is charged.

### Worked cases

Calculated by the same engine the quoter uses:

{{tabla.ejemplos}}

All values are list prices, in US dollars, before taxes (VAT, sales tax or equivalent depending on the country).

## Company size

The quoter suggests a channel based on size and countries. **It is a recommendation, never a block**: any company can sign up on its own if it wants to.

{{tabla.canales}}

**Multinationals.** They pick a contracting country and quote on **total headcount**: the volume across all countries sets the tier, and each country keeps the instrument its regulation requires.

**Neurodivergence organizations.** They pay **zero** (principle 4 of the manifesto). There is no charge: they are activated on request.

## Products

{{tabla.productos}}

{{productos.descripciones}}

**Wizor 360 absorbs Lens and Core**: if 360 is chosen, the others are not added. When there are several products, the highest-level one defines the included reports and users.

### Devices

Bought once, with no monthly fee, and they **only work with a product that supports them**. Wizor 360 **requires** them: with no sensors installed there is no measurement.

{{tabla.equipos}}

- **Smart Desktop:** fixed device for enclosed spaces; one or several units can be used per environment. Plug and play, completely silent. Measures air, VOC, noise, temperature, light and vibrations, 24/7.
- **Control panels:** the monitoring center. Fatigue, stress and air quality in real time: more than 200 variables, under 1 second of latency, in the cloud or on the client's premises, with predictive analysis.


**Cards.** Every service and device has a thumbnail and a *View details* button that open a card
alongside, with an image, a description and its features. The panel comes in from
the left on purpose: the total stays in view while the product is explained.
Escape or a click outside closes it.

Card content does not live in the price book but in its own table, because fixing
a description should not force publishing a new version of the price book. A card
that has not been reviewed is shown marked as draft.

## Pre-order and deposit

**On pre-order today:** {{preventa.productos}}, and the devices {{preventa.equipos}}.

{{preventa.entrega}}

A pre-order product is shown with its price, but the subscription is not charged: it is **reserved with a deposit**.

{{seña.reglas}}

- Is it credited against billing? **{{seña.descuenta}}**
- Is it refundable? **{{seña.reembolsable}}**
- The platform is billed only once installation is ready.

## How to sell

1. **Quote with the client.** Open `/ventas` and turn on **presentation mode** if you are going to show the screen. The commission lives in another tab; never keep it open next to it.
2. **Follow the suggested channel.** Self-service: the client signs up alone. Guided: 30-minute demo with their real headcount and sites. Proposal: consolidated offer per country.
3. **Close according to the outcome** the quoter shows (payment, deposit, request or proposal).
4. **Leave the quote in writing.** *Download PDF* asks for the company name and builds a three-page document: cover and services, devices and panels, and investment summary. What was chosen stands out and the rest is dimmed.

**Contract:** {{contrato.meses}} months, {{contrato.facturacion}} billing. A quote is valid for {{contrato.validez}} days.

**Activity not on the list.** The quoter does not price it: the client describes their activity and Wizor replies with a rate.

### Founder program

**It is not the pre-order.** It is a separate program for pioneer companies that co-develop with Wizor. There are **{{fundador.cupos}} seats per country** and Wizor decides who gets in.

{{fundador.beneficios}}

Wizor Credits tiers: {{fundador.creditos}}.

## Versions

### Price book

Updates on its own with every publication from the back office.

{{versiones.catalogo}}

### Quoter

| Date | Change |
|---|---|
| Nov 8, 2026 | The PDF quote is its own three-page document, with the company name on the cover, the chosen items highlighted and text that reads well on paper (#16). |
| Nov 8, 2026 | Wizor Lens is described as what it is: psychosocial risk assessment only. It used to also mention ergonomics and biological risk (#9). |
| Nov 8, 2026 | Services show the same thumbnail as devices: clicking the image opens their card (#8). |
| Nov 8, 2026 | Every service and device has its own card: image, description and features, in a panel that opens to the side without covering the total. The content is edited separately from the price book. |
| Nov 6, 2026 | The logo takes you to the guide from any screen (#7). |
| Nov 6, 2026 | The whole site in Spanish, English and Portuguese: quoter, commission, access and back office. The chosen language applies to every screen (#6). |
| Nov 6, 2026 | Quoter guide on the home page, in Spanish, English and Portuguese, with this versions section. |
| Nov 6, 2026 | Typography, logo and colors from sales.wizor.io (#4). |
| Nov 6, 2026 | The commission is visible with the shared password during the trial stage (#3). |
| Nov 6, 2026 | Fix: publishing a price book can no longer leave the site without prices if it fails halfway (#2). |
| Nov 6, 2026 | Deployed at quoter.wizor.io (Vercel + Neon). |
| Nov 5, 2026 | React Server Components security update (#1). |
| Nov 5, 2026 | Launch: versioned price book, pricing engine, quoter, commission on a separate route and back office. |

{{version.despliegue}}
