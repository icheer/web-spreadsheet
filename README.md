# web-spreadsheet

A simple Excel-like spreadsheet web component built with [svelte](https://github.com/sveltejs/svelte).

- dependency free
- compatible with any javascript framework/UI library
- light-weighted (size: 35KB, gzip: ~12KB)
- multiple cell type supported (input, select, multi-select, image, date, time)
- support customized **validator**, **formatter** and **computed** function
- support UNDO/REDO with ctrl+Z & ctrl+Y

## Online demo

[https://spread.vercel.app](https://spread.vercel.app)

![screenshot](https://i.ibb.co/FJrhmc4/spread-shot.png)

## How to use

Install with npm:

```bash
npm install web-spreadsheet --save
```

and import it in your code:

```js
import 'web-spreadsheet';
```

You can **also** load the code from a CDN such as jsdelivr:

```js
<script src="https://cdn.jsdelivr.net/npm/web-spreadsheet@latest/lib/index.min.js"></script>
```

then you can use the customElement `<spread-sheet></spread-sheet>` in your HTML code.

If you're using it in a Vue.js project, you can pass proper props **columns** and **data** into customElement such as `<spread-sheet :columns="columns" :data="rows"/>`
Then your spreadsheet will come into view.

The **columns** and **data** props look like these:

```js
data() {
  return {
    columns: [
      {
        text: 'Fullname',
        key: 'fullname',
        type: 'input',
        width: '200px',
        props: {
          maxlength: 25
        },
        params: {
          validator: (value, row) => {
            const name = (value || '').trim();
            if (!name) return 'Please enter Fullname';
            if (name.length > 25) return 'Fullname length should less than 25';
          }
        }
      },
      {
        text: 'Department',
        key: 'dept',
        type: 'select',
        width: '8em',
        items: [
          { label: 'Operation', value: 'OP' },
          { label: 'IT Support', value: 'IT' }
        ]
      },
      {
        text: 'Identity type',
        key: 'idType',
        type: 'multi-select',
        width: '6em',
        items: [
          { label: 'ID Card', value: 'ID' },
          { label: 'Passport', value: 'PASSPORT' }
        ]
      },
      {
        text: 'Identity number',
        key: 'idNumber',
        type: 'input',
        width: '9em',
        props: {
          maxlength: 18
        }
      },
      {
        text: 'Fee',
        key: 'fee',
        align: 'right',
        type: 'input',
        width: '5em',
        props: {
          maxlength: 8
        },
        params: {
          validator: str => {
            if (!str) return;
            const num = +str;
            if (Number.isNaN(num)) return 'Please enter a number';
          },
          formatter: str => {
            const num = +str;
            return num.toFixed(2);
          }
        }
      },
      {
        text: 'Total Fee(+10)',
        key: 'totalFee',
        align: 'right',
        type: 'input',
        width: '9em',
        props: {
          maxlength: 8
        },
        params: {
          validator: str => {
            if (!str) return;
            const num = +str;
            if (Number.isNaN(num)) return 'Please enter a number';
          },
          formatter: str => {
            const num = +str;
            return num.toFixed(2);
          },
          computed: (row, column) => {
            const num = +row.fee || 0;
            return (num + 10).toFixed(2);
          }
        }
      },
      {
        text: 'Pictures',
        key: 'pics',
        type: 'image',
        width: '8.5em',
        props: {
          max: 3, // means can upload 3 pics at most
          uploadApi: 'http://192.168.105.11:28080/api/file/common/upload'
        }
      },
      {
        text: 'Update Time',
        key: 'updateTime',
        type: 'date',
        width: '8em'
      }
    ],
    rows: [
      {
        fullName: 'Tony Joe',
        dept: 'OP',
        idType: ['ID', 'PASSPORT'],
        idNumber: '12341122234',
        fee: 33,
        pics: [
          'https://github.blog/wp-content/uploads/2019/03/product-social.png?fit=1201%2C630',
          '//fpoimg.com/400x400?text=Preview&bg_color=000000',
          '//fpoimg.com/400x400?text=Preview&bg_color=ffeeee'
        ],
        updateTime: '2020-02-01'
      },
      {
        fullName: 'Mary Lee',
        dept: 'IT',
        idType: ['ID'],
        idNumber: '6515151374',
        fee: 25,
        pics: [
          '//fpoimg.com/400x400?text=Preview&bg_color=eeffee'
        ],
        updateTime: '2020-02-02'
      }
    ]
  }
}
```

If you want to use it in pure javascript, you can refer the [demo page](https://spread.vercel.app).

## FEATURES
- cell type: input, select, multi-select, image, date, time (depends on columns array)
- when the row data changed, it will automaticly emit a "change" event, so you can handle the newest row data
- validator / formatter / computed functions can be added in column.params object
- log at most 20 change history in memory, so you can press ctrl+Z/Y to UNDO/REDO
- right clicking the row head can call the context menu which can insert/delete the row
- upload images and preview images
- auto switch languages(CN or EN) depends on your `<html lang="___">`
- keypress behavior like Excel (arrows, escape, tab, delete, backspace etc)
- pasted letters by ctrl+V will fill current highlighted input cell
- for those non-modern browsers which don't support shadowDOM or customElement, you can use polyfill to let them support: just add a `<script src="https://cdn.jsdelivr.net/npm/@webcomponents/webcomponentsjs@2.5.0/webcomponents-bundle.min.js"></script>` in `<head>`

## TODO
- [ ] column actions such as insert/delete column
- [ ] ...
