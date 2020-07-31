import * as express from 'express';
import * as db from './db';
import * as moment from 'moment-timezone';
import e = require('express');
export const app = express()
const port = 3000

function fromTemplate(title: string, body: string): string {
    return `<!doctype html>
    <html lang="en">
      <head>
        <!-- Required meta tags -->
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    
        <!-- Bootstrap CSS -->
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
    
        <title>${title}</title>
      </head>
      <body>
        <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="">Augie Computer Science Club Rankings &nbsp;&nbsp;&nbsp;</li>  <li class=""><a href="/rank">View Rankings</a></li>
        </ol>
        </nav>
        <div class="card"><div class="card-body">${body}</div></div>
        generated: ${moment().tz(process.env.TZ).format('MMMM Do YYYY, h:mm:ss a z')}
        <!-- Optional JavaScript -->
        <!-- jQuery first, then Popper.js, then Bootstrap JS -->
        <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js" integrity="sha384-OgVRvuATP1z7JjHLkuOU7Xw704+h835Lr+6QL9UvYjZE3Ipu6Tp75j7Bh/kR0JKI" crossorigin="anonymous"></script>
        <script>$('.tooltip-filler').tooltip()</script>
      </body>
    </html>`
}

app.get('/', (req, res) => {
    res.send(fromTemplate('scores', ''));
})
app.get('/rank', async (req, res) => {
    try {
        const result = await db.getHighScores(75);
        if(!result.worked) throw 'error';
        if(result.results.length<1) throw 'error';
        let table = "<table class='table table-striped table-bordered table-hover'><thead><tr><th>Rank</th><th>Points</th><th>Name</th></tr></thead>";
        result.results.forEach((e,i)=>table+=`<tr onclick="window.location='/inspect/${e.id}'"><td>${i+1}</td><td>${e.score}</td><td>${e.name}</td>`);
        table+="</table>";
        res.send(fromTemplate('rank', table));
    } catch (error){
        res.send('that did not work.');
    }
});

app.get('/inspect/*', async (req,res) => {
    try {
        const parts = req.url.split('/');
        if(parts.length<2) throw 'error';
        const id = parts[parts.length-1].trim().toLowerCase();
        if(!db.validateObjectID(id)) throw 'error';
        //it is a valid objectId.
        const results = await db.inspectUserById(id);
        if(!results.worked) throw 'error';
        let response = `<div><h1>${results.name}</h1></div><div>points: ${results.points}.</div><div><table class='table table-striped table-bordered table-hover'><thead><tr><th>Name</th><th>Points</th><th>Date</th><th>With</th></tr></thead>`;
        results.events.forEach((e)=>{
            let withStr = "";
            if(e.with.length==0) withStr = "none";
            e.with.forEach((p)=>{
                withStr+=`<a href="/inspect/${p.id}"> ${p.name}</a>,`
            });
            if(e.with.length==0) withStr = "none";
            else withStr = withStr.substr(0,withStr.length-1);
            response+=`<tr class='tooltip-filler' data-toggle='tooltip' data-placement='bottom' title='click to copy id (${e.id})' onClick='navigator.clipboard.writeText("${e.id}")'><td>${e.name}</td><td>${e.points}</td><td>${e.date}</td><td>${withStr}</td><tr/>`;
        });
        response+="</table>"
        res.send(fromTemplate(`inspect ${results.name}`, response));
    } catch (error){
        res.send('that did not work');
    }
});