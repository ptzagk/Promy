<app>
    <div>
        <yield></yield>
    </div>
    <script>
        opts.subscribe((state)=>this.update({state}))
    </script>
</app>