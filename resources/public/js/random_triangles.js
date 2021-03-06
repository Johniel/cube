var makeGeometryObject = function (triangles, n, n2, d, d2, chunkSize)
{
    var geometry = new THREE.BufferGeometry();
    geometry.attributes = {
        index: {
            itemSize: 1,
            array: new Uint16Array( triangles * 3 ),
            numItems: triangles * 3
        },
        position: {
            itemSize: 3,
            array: new Float32Array( triangles * 3 * 3 ),
            numItems: triangles * 3 * 3
        },
        normal: {
            itemSize: 3,
            array: new Float32Array( triangles * 3 * 3 ),
            numItems: triangles * 3 * 3
        },
        color: {
            itemSize: 3,
            array: new Float32Array( triangles * 3 * 3 ),
            numItems: triangles * 3 * 3
        }
    }


    var chunkSize = 21845;

    var indices = geometry.attributes.index.array;

    for ( var i = 0; i < indices.length; i ++ ) {
        indices[ i ] = i % ( 3 * chunkSize );
    }

    var positions = geometry.attributes.position.array;
    var normals = geometry.attributes.normal.array;
    var colors = geometry.attributes.color.array;

    var color = new THREE.Color();

    var pA = new THREE.Vector3();
    var pB = new THREE.Vector3();
    var pC = new THREE.Vector3();

    var cb = new THREE.Vector3();
    var ab = new THREE.Vector3();

    for ( var i = 0; i < positions.length; i += 9 ) {

        // positions

        var x = Math.random() * n - n2;
        var y = Math.random() * n - n2;
        var z = Math.random() * n - n2;

        var ax = x + Math.random() * d - d2;
        var ay = y + Math.random() * d - d2;
        var az = z + Math.random() * d - d2;

        var bx = x + Math.random() * d - d2;
        var by = y + Math.random() * d - d2;
        var bz = z + Math.random() * d - d2;

        var cx = x + Math.random() * d - d2;
        var cy = y + Math.random() * d - d2;
        var cz = z + Math.random() * d - d2;

        positions[ i ]     = ax;
        positions[ i + 1 ] = ay;
        positions[ i + 2 ] = az;

        positions[ i + 3 ] = bx;
        positions[ i + 4 ] = by;
        positions[ i + 5 ] = bz;

        positions[ i + 6 ] = cx;
        positions[ i + 7 ] = cy;
        positions[ i + 8 ] = cz;

        // flat face normals

        pA.set( ax, ay, az );
        pB.set( bx, by, bz );
        pC.set( cx, cy, cz );

        cb.subVectors( pC, pB );
        ab.subVectors( pA, pB );
        cb.cross( ab );

        cb.normalize();

        var nx = cb.x;
        var ny = cb.y;
        var nz = cb.z;

        normals[ i ]     = nx;
        normals[ i + 1 ] = ny;
        normals[ i + 2 ] = nz;

        normals[ i + 3 ] = nx;
        normals[ i + 4 ] = ny;
        normals[ i + 5 ] = nz;

        normals[ i + 6 ] = nx;
        normals[ i + 7 ] = ny;
        normals[ i + 8 ] = nz;

        // colors

        var vx = ( x / n ) + 0.5;
        var vy = ( y / n ) + 0.5;
        var vz = ( z / n ) + 0.5;

        color.setRGB( vx, vy, vz );

        colors[ i ]     = color.r;
        colors[ i + 1 ] = color.g;
        colors[ i + 2 ] = color.b;

        colors[ i + 3 ] = color.r;
        colors[ i + 4 ] = color.g;
        colors[ i + 5 ] = color.b;

        colors[ i + 6 ] = color.r;
        colors[ i + 7 ] = color.g;
        colors[ i + 8 ] = color.b;

    }
    geometry.offsets = [];

    var offsets = triangles / chunkSize;
    for ( var i = 0; i < offsets; i ++ ) {
        var offset = {
            start: i * chunkSize * 3,
            index: i * chunkSize * 3,
            count: Math.min( triangles - ( i * chunkSize ), chunkSize ) * 3
        };
        geometry.offsets.push( offset );
    }

    geometry.computeBoundingSphere();

    return geometry;
};
