/**
 * Created by Corentin THOMASSET.
 * https://github.com/CorentinTh
 * Project under MIT licensing
 */

/**
 * Box class.
 * @class Box
 */
class Box {

    /**
     * Box constructor;
     * @constructs Box
     * @param {number} x - X coordinate of the box.
     * @param {number} y - Y coordinate of the box.
     * @param {number} w - Width of the box.
     * @param {number} h - Height of the box.
     * @param {*} [data] - Data to store along the box.
     */
    constructor(x, y, w, h, data) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        if (data) this.data = data;
    }

    /**
     * Check if a point is contained in the box.
     * @param {Point|Object} point - The point to test if it is contained in the box.
     * @returns {boolean} - True if the point is contained in the box, otherwise false.
     */
    contains(point) {
        return point.x >= this.x &&
            point.x <= this.x + this.w &&
            point.y >= this.y &&
            point.y <= this.y + this.h;
    }

    /**
     * Check if a box intersects with this box.
     * @param {Box|Object} range - The box to test the intersection with.
     * @returns {boolean} - True if it intersects, otherwise false.
     */
    intersects(range) {
        return !(range.x > this.x + this.w
            || range.x + range.w < this.x
            || range.y > this.y + this.h
            || range.y + range.h < this.y);
    }

}

/**
 * Box Circle.
 * @class Circle
 */
class Circle {

    /**
     * Circle constructor;
     * @constructs Circle
     * @param {number} x - X coordinate of the circle.
     * @param {number} y - Y coordinate of the circle.
     * @param {number} r - Radius of the circle.
     * @param {*} [data] - Data to store along the circle.
     */
    constructor(x, y, r, data) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.rPow2 = this.r * this.r; // To avoid square roots
        if (data) this.data = data;
    }

    _euclideanDistancePow2(point1, point2) {
        return Math.pow((point1.x - point2.x), 2) + Math.pow((point1.y - point2.y), 2);
    }

    /**
     * Check if a point is contained in the circle.
     * @param {Point|Object} point - The point to test if it is contained in the circle.
     * @returns {boolean} - True if the point is contained in the circle, otherwise false.
     */
    contains(point) {
        return this._euclideanDistancePow2(point, this) <= this.rPow2;
    }

    /**
     * Check if a box intersects with this circle.
     * @param {Box|Object} range - The box to test the intersection with.
     * @returns {boolean} - True if it intersects, otherwise false.
     */
    intersects(range) {
        const Max = (a, b) => a >= b ? a : b;
        const Min = (a, b) => a <= b ? a : b;

        const dX = this.x - Max(range.x, Min(this.x, range.x + range.w));
        const dY = this.y - Max(range.y, Min(this.y, range.y + range.h));
        return (dX * dX + dY * dY) <= (this.rPow2);
    }
}

/**
 * Point class.
 * @class Point
 */
class Point {

    /**
     * Point constructor.
     * @constructs Point
     * @param {number} x - X coordinate of the point.
     * @param {number} y - Y coordinate of the point.
     * @param {*} [data] - Data to store along the point.
     */
    constructor(x, y, data) {
        this.x = x;
        this.y = y;
        if (data) this.data = data;
    }

}


/**
 * QuadTree class.
 * @class QuadTree
 */
class QuadTree {
    /**
     * Create a new QuadTree
     * @constructor
     * @param {Box} container - The box on which the QuadTree will operate.
     * @param {Object} [config] - The configuration of the quadtree.
     * @param {number} [config.capacity] - The maximum amount of points per node.
     * @param {boolean} [config.removeEmptyNodes] - Specify if the quadtree has to remove subnodes if they are empty.
     * @param {(Object[]|Point[])} [points] - An array of initial points to insert in the QuadTree.
     * @param {number} points[].x - X coordinate of the point.
     * @param {number} points[].y - Y coordinate of the point.
     */
    constructor(container, config, points = []) {
        this._container = container;
        this._config = this._parseConfig(config);

        this._isDivided = false;
        this._points = [];

        for (let point of points) {
            this._insert(point);
        }
    }

    /**
     * Parses the configuration and assigns the default values
     * @param {Object} config - The user configuration
     * @returns {Object}
     * @private
     */
    _parseConfig(config) {
        const defaultConfig = {
            capacity: 4,
            removeEmptyNodes: false
        };

        return Object.assign({}, defaultConfig, config);
    }


    getTree() {
        return this._getTree();
    }

    _getTree() {

        let tree;

        if (this._isDivided) {
            tree = {
                ne: this._ne._getTree(),
                nw: this._nw._getTree(),
                se: this._se._getTree(),
                sw: this._sw._getTree()
            };

        } else {
            tree = this._getNodePointAmount();
        }

        return tree;
    }

    /**
     * Get all the points in the QuadTree
     * @returns {(Object[]|Point[])} - An array containing all the points.
     */
    getAllPoints() {
        const pointsList = [];
        this._getAllPoints(pointsList);
        return pointsList;
    }

    /**
     * Get all the points in the QuadTree
     * @param {(Object[]|Point[])} pointsList
     * @private
     */
    _getAllPoints(pointsList) {
        if (!this._isDivided) {
            Array.prototype.push.apply(pointsList, this._points.slice());
            return;
        }

        this._ne._getAllPoints(pointsList);
        this._nw._getAllPoints(pointsList);
        this._se._getAllPoints(pointsList);
        this._sw._getAllPoints(pointsList);
    }

    /**
     * Return the amount of points in this node.
     * @returns {number} - The amount of points in this node.
     * @private
     */
    _getNodePointAmount() {
        return this._points.length;
    }

    /**
     * Divide this node into 4 sub-nodes
     * @private
     */
    _divide() {
        this._isDivided = true;

        let x = this._container.x;
        let y = this._container.y;
        let w = this._container.w / 2;
        let h = this._container.h / 2;

        // Creation of the sub-nodes, and insertion of the current point
        this._ne = new QuadTree(new Box(x + w, y, w, h), this._config, this._points.slice());
        this._nw = new QuadTree(new Box(x, y, w, h), this._config, this._points.slice());
        this._se = new QuadTree(new Box(x + w, y + h, w, h), this._config, this._points.slice());
        this._sw = new QuadTree(new Box(x, y + h, w, h), this._config, this._points.slice());

        // We empty this node points
        this._points.length = 0;
        this._points = [];
    }

    /**
     * Remove a point in the QuadTree
     * @param {(Point|Object|Point[]|Object[])} pointOrArray - A point or an array of points to remove
     * @param {number} pointOrArray.x - X coordinate of the point
     * @param {number} pointOrArray.y - Y coordinate of the point
     */
    remove(pointOrArray) {
        if (pointOrArray.constructor === Array) {
            for (const point of pointOrArray) {
                this._remove(point);
            }
        } else {
            this._remove(pointOrArray);
        }
    }

    /**
     * Remove a point in the QuadTree
     * @param {(Point|Object)} point - A point to remove
     * @param {number} point.x - X coordinate of the point
     * @param {number} point.y - Y coordinate of the point
     * @private
     */
    _remove(point) {
        if (!this._container.contains(point)) {
            return;
        }

        if (!this._isDivided) {
            //this._points.splice(this._points.findIndex(aPoint => aPoint.x === point.x && aPoint.y === point.y), 1);

            const len = this._points.length;
            for (let i = len - 1; i >= 0; i--) {
                if (point.x === this._points[i].x && point.y === this._points[i].y) {
                    this._points.splice(i, 1);
                }
            }

            return;
        }

        this._ne._remove(point);
        this._nw._remove(point);
        this._se._remove(point);
        this._sw._remove(point);

        if (this._config.removeEmptyNodes) {
            if (this._ne._getNodePointAmount() === 0 && !this._ne._isDivided &&
                this._nw._getNodePointAmount() === 0 && !this._nw._isDivided &&
                this._se._getNodePointAmount() === 0 && !this._se._isDivided &&
                this._sw._getNodePointAmount() === 0 && !this._sw._isDivided) {

                this._isDivided = false;

                delete this._ne;
                delete this._nw;
                delete this._se;
                delete this._sw;
            }
        }
    }

    /**
     * Insert a point in the QuadTree
     * @param {(Point|Object|Point[]|Object[])} pointOrArray - A point or an array of points to insert
     * @param {number} pointOrArray.x - X coordinate of the point
     * @param {number} pointOrArray.y - Y coordinate of the point
     */
    insert(pointOrArray) {
        if (pointOrArray.constructor === Array) {
            for (const point of pointOrArray) {
                this._insert(point);
            }
        } else {
            this._insert(pointOrArray);
        }
    }


    /**
     * Insert a point in the QuadTree
     * @param {(Point|Object)} point - A point to insert
     * @param {number} point.x - X coordinate of the point
     * @param {number} point.y - Y coordinate of the point
     * @returns {boolean}
     * @private
     */
    _insert(point) {
        if (!this._container.contains(point)) {
            return false;
        }

        if (!this._isDivided) {
            if (this._getNodePointAmount() < this._config.capacity) {
                this._points.push(point);
                return true;
            }

            this._divide();
        }

        if (this._ne._insert(point)) return true;
        if (this._nw._insert(point)) return true;
        if (this._se._insert(point)) return true;
        if (this._sw._insert(point)) return true;

        return false;
    }

    /**
     * Query all the point within a range
     * @param {(Box|Object|Circle)} range - The range to test
     * @param {number} range.x - X coordinate of the range.
     * @param {number} range.y - Y coordinate of the range.
     * @param {number} range.w - Width of the range.
     * @param {number} range.h - Height of the range.
     * @returns {(Point[]|Object[])} - The points within the range
     */
    query(range) {
        let pointsFound = [];
        this._query(range, pointsFound);
        return pointsFound;
    }

    /**
     * @param {(Box|Object)} range
     * @param {(Point[]|Object[])} pointsFound
     * @returns {(Point[]|Object[])}
     * @private
     */
    _query(range, pointsFound) {
        if (!range.intersects(this._container)) {
            return pointsFound;
        }

        if (this._isDivided) {
            this._ne._query(range, pointsFound);
            this._nw._query(range, pointsFound);
            this._se._query(range, pointsFound);
            this._sw._query(range, pointsFound);
        } else {
            const p = this._points.filter((point) => range.contains(point));

            Array.prototype.push.apply(pointsFound, p);
        }

        return pointsFound;
    }

    /**
     * Clear the QuadTree
     */
    clear() {
        this._points = [];

        delete this._ne;
        delete this._nw;
        delete this._se;
        delete this._sw;
    }
}

export {Box, Circle, Point, QuadTree};


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgQ29yZW50aW4gVEhPTUFTU0VULlxuICogaHR0cHM6Ly9naXRodWIuY29tL0NvcmVudGluVGhcbiAqIFByb2plY3QgdW5kZXIgTUlUIGxpY2Vuc2luZ1xuICovXG5cbi8qKlxyXG4gKiBCb3ggY2xhc3MuXHJcbiAqIEBjbGFzcyBCb3hcclxuICovXHJcbmNsYXNzIEJveCB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCb3ggY29uc3RydWN0b3I7XHJcbiAgICAgKiBAY29uc3RydWN0cyBCb3hcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gWCBjb29yZGluYXRlIG9mIHRoZSBib3guXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFkgY29vcmRpbmF0ZSBvZiB0aGUgYm94LlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHcgLSBXaWR0aCBvZiB0aGUgYm94LlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGggLSBIZWlnaHQgb2YgdGhlIGJveC5cclxuICAgICAqIEBwYXJhbSB7Kn0gW2RhdGFdIC0gRGF0YSB0byBzdG9yZSBhbG9uZyB0aGUgYm94LlxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih4LCB5LCB3LCBoLCBkYXRhKSB7XHJcbiAgICAgICAgdGhpcy54ID0geDtcclxuICAgICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICAgIHRoaXMudyA9IHc7XHJcbiAgICAgICAgdGhpcy5oID0gaDtcclxuICAgICAgICBpZiAoZGF0YSkgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIGlmIGEgcG9pbnQgaXMgY29udGFpbmVkIGluIHRoZSBib3guXHJcbiAgICAgKiBAcGFyYW0ge1BvaW50fE9iamVjdH0gcG9pbnQgLSBUaGUgcG9pbnQgdG8gdGVzdCBpZiBpdCBpcyBjb250YWluZWQgaW4gdGhlIGJveC5cclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFRydWUgaWYgdGhlIHBvaW50IGlzIGNvbnRhaW5lZCBpbiB0aGUgYm94LCBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIGNvbnRhaW5zKHBvaW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHBvaW50LnggPj0gdGhpcy54ICYmXHJcbiAgICAgICAgICAgIHBvaW50LnggPD0gdGhpcy54ICsgdGhpcy53ICYmXHJcbiAgICAgICAgICAgIHBvaW50LnkgPj0gdGhpcy55ICYmXHJcbiAgICAgICAgICAgIHBvaW50LnkgPD0gdGhpcy55ICsgdGhpcy5oO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2sgaWYgYSBib3ggaW50ZXJzZWN0cyB3aXRoIHRoaXMgYm94LlxyXG4gICAgICogQHBhcmFtIHtCb3h8T2JqZWN0fSByYW5nZSAtIFRoZSBib3ggdG8gdGVzdCB0aGUgaW50ZXJzZWN0aW9uIHdpdGguXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBUcnVlIGlmIGl0IGludGVyc2VjdHMsIG90aGVyd2lzZSBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgaW50ZXJzZWN0cyhyYW5nZSkge1xyXG4gICAgICAgIHJldHVybiAhKHJhbmdlLnggPiB0aGlzLnggKyB0aGlzLndcclxuICAgICAgICAgICAgfHwgcmFuZ2UueCArIHJhbmdlLncgPCB0aGlzLnhcclxuICAgICAgICAgICAgfHwgcmFuZ2UueSA+IHRoaXMueSArIHRoaXMuaFxyXG4gICAgICAgICAgICB8fCByYW5nZS55ICsgcmFuZ2UuaCA8IHRoaXMueSk7XHJcbiAgICB9XHJcblxyXG59XG5cclxuLyoqXHJcbiAqIEJveCBDaXJjbGUuXHJcbiAqIEBjbGFzcyBDaXJjbGVcclxuICovXHJcbmNsYXNzIENpcmNsZSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaXJjbGUgY29uc3RydWN0b3I7XHJcbiAgICAgKiBAY29uc3RydWN0cyBDaXJjbGVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gWCBjb29yZGluYXRlIG9mIHRoZSBjaXJjbGUuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFkgY29vcmRpbmF0ZSBvZiB0aGUgY2lyY2xlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHIgLSBSYWRpdXMgb2YgdGhlIGNpcmNsZS5cclxuICAgICAqIEBwYXJhbSB7Kn0gW2RhdGFdIC0gRGF0YSB0byBzdG9yZSBhbG9uZyB0aGUgY2lyY2xlLlxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih4LCB5LCByLCBkYXRhKSB7XHJcbiAgICAgICAgdGhpcy54ID0geDtcclxuICAgICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICAgIHRoaXMuciA9IHI7XHJcbiAgICAgICAgdGhpcy5yUG93MiA9IHRoaXMuciAqIHRoaXMucjsgLy8gVG8gYXZvaWQgc3F1YXJlIHJvb3RzXHJcbiAgICAgICAgaWYgKGRhdGEpIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgX2V1Y2xpZGVhbkRpc3RhbmNlUG93Mihwb2ludDEsIHBvaW50Mikge1xyXG4gICAgICAgIHJldHVybiBNYXRoLnBvdygocG9pbnQxLnggLSBwb2ludDIueCksIDIpICsgTWF0aC5wb3coKHBvaW50MS55IC0gcG9pbnQyLnkpLCAyKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIGlmIGEgcG9pbnQgaXMgY29udGFpbmVkIGluIHRoZSBjaXJjbGUuXHJcbiAgICAgKiBAcGFyYW0ge1BvaW50fE9iamVjdH0gcG9pbnQgLSBUaGUgcG9pbnQgdG8gdGVzdCBpZiBpdCBpcyBjb250YWluZWQgaW4gdGhlIGNpcmNsZS5cclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFRydWUgaWYgdGhlIHBvaW50IGlzIGNvbnRhaW5lZCBpbiB0aGUgY2lyY2xlLCBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIGNvbnRhaW5zKHBvaW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2V1Y2xpZGVhbkRpc3RhbmNlUG93Mihwb2ludCwgdGhpcykgPD0gdGhpcy5yUG93MjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIGlmIGEgYm94IGludGVyc2VjdHMgd2l0aCB0aGlzIGNpcmNsZS5cclxuICAgICAqIEBwYXJhbSB7Qm94fE9iamVjdH0gcmFuZ2UgLSBUaGUgYm94IHRvIHRlc3QgdGhlIGludGVyc2VjdGlvbiB3aXRoLlxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IC0gVHJ1ZSBpZiBpdCBpbnRlcnNlY3RzLCBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIGludGVyc2VjdHMocmFuZ2UpIHtcclxuICAgICAgICBjb25zdCBNYXggPSAoYSwgYikgPT4gYSA+PSBiID8gYSA6IGI7XHJcbiAgICAgICAgY29uc3QgTWluID0gKGEsIGIpID0+IGEgPD0gYiA/IGEgOiBiO1xyXG5cclxuICAgICAgICBjb25zdCBkWCA9IHRoaXMueCAtIE1heChyYW5nZS54LCBNaW4odGhpcy54LCByYW5nZS54ICsgcmFuZ2UudykpO1xyXG4gICAgICAgIGNvbnN0IGRZID0gdGhpcy55IC0gTWF4KHJhbmdlLnksIE1pbih0aGlzLnksIHJhbmdlLnkgKyByYW5nZS5oKSk7XHJcbiAgICAgICAgcmV0dXJuIChkWCAqIGRYICsgZFkgKiBkWSkgPD0gKHRoaXMuclBvdzIpO1xyXG4gICAgfVxyXG59XG5cclxuLyoqXHJcbiAqIFBvaW50IGNsYXNzLlxyXG4gKiBAY2xhc3MgUG9pbnRcclxuICovXHJcbmNsYXNzIFBvaW50IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBvaW50IGNvbnN0cnVjdG9yLlxyXG4gICAgICogQGNvbnN0cnVjdHMgUG9pbnRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gWCBjb29yZGluYXRlIG9mIHRoZSBwb2ludC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gWSBjb29yZGluYXRlIG9mIHRoZSBwb2ludC5cclxuICAgICAqIEBwYXJhbSB7Kn0gW2RhdGFdIC0gRGF0YSB0byBzdG9yZSBhbG9uZyB0aGUgcG9pbnQuXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHgsIHksIGRhdGEpIHtcclxuICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgIHRoaXMueSA9IHk7XHJcbiAgICAgICAgaWYgKGRhdGEpIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICB9XHJcblxyXG59XG5cclxuXHJcbi8qKlxyXG4gKiBRdWFkVHJlZSBjbGFzcy5cclxuICogQGNsYXNzIFF1YWRUcmVlXHJcbiAqL1xyXG5jbGFzcyBRdWFkVHJlZSB7XHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIG5ldyBRdWFkVHJlZVxyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKiBAcGFyYW0ge0JveH0gY29udGFpbmVyIC0gVGhlIGJveCBvbiB3aGljaCB0aGUgUXVhZFRyZWUgd2lsbCBvcGVyYXRlLlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb25maWddIC0gVGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHF1YWR0cmVlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuY2FwYWNpdHldIC0gVGhlIG1heGltdW0gYW1vdW50IG9mIHBvaW50cyBwZXIgbm9kZS5cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZW1vdmVFbXB0eU5vZGVzXSAtIFNwZWNpZnkgaWYgdGhlIHF1YWR0cmVlIGhhcyB0byByZW1vdmUgc3Vibm9kZXMgaWYgdGhleSBhcmUgZW1wdHkuXHJcbiAgICAgKiBAcGFyYW0geyhPYmplY3RbXXxQb2ludFtdKX0gW3BvaW50c10gLSBBbiBhcnJheSBvZiBpbml0aWFsIHBvaW50cyB0byBpbnNlcnQgaW4gdGhlIFF1YWRUcmVlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBvaW50c1tdLnggLSBYIGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50LlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBvaW50c1tdLnkgLSBZIGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50LlxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcihjb250YWluZXIsIGNvbmZpZywgcG9pbnRzID0gW10pIHtcclxuICAgICAgICB0aGlzLl9jb250YWluZXIgPSBjb250YWluZXI7XHJcbiAgICAgICAgdGhpcy5fY29uZmlnID0gdGhpcy5fcGFyc2VDb25maWcoY29uZmlnKTtcclxuXHJcbiAgICAgICAgdGhpcy5faXNEaXZpZGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fcG9pbnRzID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IHBvaW50IG9mIHBvaW50cykge1xyXG4gICAgICAgICAgICB0aGlzLl9pbnNlcnQocG9pbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlcyB0aGUgY29uZmlndXJhdGlvbiBhbmQgYXNzaWducyB0aGUgZGVmYXVsdCB2YWx1ZXNcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgLSBUaGUgdXNlciBjb25maWd1cmF0aW9uXHJcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX3BhcnNlQ29uZmlnKGNvbmZpZykge1xyXG4gICAgICAgIGNvbnN0IGRlZmF1bHRDb25maWcgPSB7XHJcbiAgICAgICAgICAgIGNhcGFjaXR5OiA0LFxyXG4gICAgICAgICAgICByZW1vdmVFbXB0eU5vZGVzOiBmYWxzZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0Q29uZmlnLCBjb25maWcpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBnZXRUcmVlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRUcmVlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgX2dldFRyZWUoKSB7XHJcblxyXG4gICAgICAgIGxldCB0cmVlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5faXNEaXZpZGVkKSB7XHJcbiAgICAgICAgICAgIHRyZWUgPSB7XHJcbiAgICAgICAgICAgICAgICBuZTogdGhpcy5fbmUuX2dldFRyZWUoKSxcclxuICAgICAgICAgICAgICAgIG53OiB0aGlzLl9udy5fZ2V0VHJlZSgpLFxyXG4gICAgICAgICAgICAgICAgc2U6IHRoaXMuX3NlLl9nZXRUcmVlKCksXHJcbiAgICAgICAgICAgICAgICBzdzogdGhpcy5fc3cuX2dldFRyZWUoKVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0cmVlID0gdGhpcy5fZ2V0Tm9kZVBvaW50QW1vdW50KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJlZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBhbGwgdGhlIHBvaW50cyBpbiB0aGUgUXVhZFRyZWVcclxuICAgICAqIEByZXR1cm5zIHsoT2JqZWN0W118UG9pbnRbXSl9IC0gQW4gYXJyYXkgY29udGFpbmluZyBhbGwgdGhlIHBvaW50cy5cclxuICAgICAqL1xyXG4gICAgZ2V0QWxsUG9pbnRzKCkge1xyXG4gICAgICAgIGNvbnN0IHBvaW50c0xpc3QgPSBbXTtcclxuICAgICAgICB0aGlzLl9nZXRBbGxQb2ludHMocG9pbnRzTGlzdCk7XHJcbiAgICAgICAgcmV0dXJuIHBvaW50c0xpc3Q7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgYWxsIHRoZSBwb2ludHMgaW4gdGhlIFF1YWRUcmVlXHJcbiAgICAgKiBAcGFyYW0geyhPYmplY3RbXXxQb2ludFtdKX0gcG9pbnRzTGlzdFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2dldEFsbFBvaW50cyhwb2ludHNMaXN0KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9pc0RpdmlkZWQpIHtcclxuICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkocG9pbnRzTGlzdCwgdGhpcy5fcG9pbnRzLnNsaWNlKCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9uZS5fZ2V0QWxsUG9pbnRzKHBvaW50c0xpc3QpO1xyXG4gICAgICAgIHRoaXMuX253Ll9nZXRBbGxQb2ludHMocG9pbnRzTGlzdCk7XHJcbiAgICAgICAgdGhpcy5fc2UuX2dldEFsbFBvaW50cyhwb2ludHNMaXN0KTtcclxuICAgICAgICB0aGlzLl9zdy5fZ2V0QWxsUG9pbnRzKHBvaW50c0xpc3QpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIHRoZSBhbW91bnQgb2YgcG9pbnRzIGluIHRoaXMgbm9kZS5cclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IC0gVGhlIGFtb3VudCBvZiBwb2ludHMgaW4gdGhpcyBub2RlLlxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2dldE5vZGVQb2ludEFtb3VudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcG9pbnRzLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERpdmlkZSB0aGlzIG5vZGUgaW50byA0IHN1Yi1ub2Rlc1xyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2RpdmlkZSgpIHtcclxuICAgICAgICB0aGlzLl9pc0RpdmlkZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBsZXQgeCA9IHRoaXMuX2NvbnRhaW5lci54O1xyXG4gICAgICAgIGxldCB5ID0gdGhpcy5fY29udGFpbmVyLnk7XHJcbiAgICAgICAgbGV0IHcgPSB0aGlzLl9jb250YWluZXIudyAvIDI7XHJcbiAgICAgICAgbGV0IGggPSB0aGlzLl9jb250YWluZXIuaCAvIDI7XHJcblxyXG4gICAgICAgIC8vIENyZWF0aW9uIG9mIHRoZSBzdWItbm9kZXMsIGFuZCBpbnNlcnRpb24gb2YgdGhlIGN1cnJlbnQgcG9pbnRcclxuICAgICAgICB0aGlzLl9uZSA9IG5ldyBRdWFkVHJlZShuZXcgQm94KHggKyB3LCB5LCB3LCBoKSwgdGhpcy5fY29uZmlnLCB0aGlzLl9wb2ludHMuc2xpY2UoKSk7XHJcbiAgICAgICAgdGhpcy5fbncgPSBuZXcgUXVhZFRyZWUobmV3IEJveCh4LCB5LCB3LCBoKSwgdGhpcy5fY29uZmlnLCB0aGlzLl9wb2ludHMuc2xpY2UoKSk7XHJcbiAgICAgICAgdGhpcy5fc2UgPSBuZXcgUXVhZFRyZWUobmV3IEJveCh4ICsgdywgeSArIGgsIHcsIGgpLCB0aGlzLl9jb25maWcsIHRoaXMuX3BvaW50cy5zbGljZSgpKTtcclxuICAgICAgICB0aGlzLl9zdyA9IG5ldyBRdWFkVHJlZShuZXcgQm94KHgsIHkgKyBoLCB3LCBoKSwgdGhpcy5fY29uZmlnLCB0aGlzLl9wb2ludHMuc2xpY2UoKSk7XHJcblxyXG4gICAgICAgIC8vIFdlIGVtcHR5IHRoaXMgbm9kZSBwb2ludHNcclxuICAgICAgICB0aGlzLl9wb2ludHMubGVuZ3RoID0gMDtcclxuICAgICAgICB0aGlzLl9wb2ludHMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBhIHBvaW50IGluIHRoZSBRdWFkVHJlZVxyXG4gICAgICogQHBhcmFtIHsoUG9pbnR8T2JqZWN0fFBvaW50W118T2JqZWN0W10pfSBwb2ludE9yQXJyYXkgLSBBIHBvaW50IG9yIGFuIGFycmF5IG9mIHBvaW50cyB0byByZW1vdmVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwb2ludE9yQXJyYXkueCAtIFggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwb2ludE9yQXJyYXkueSAtIFkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlKHBvaW50T3JBcnJheSkge1xyXG4gICAgICAgIGlmIChwb2ludE9yQXJyYXkuY29uc3RydWN0b3IgPT09IEFycmF5KSB7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgcG9pbnQgb2YgcG9pbnRPckFycmF5KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmUocG9pbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlKHBvaW50T3JBcnJheSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGEgcG9pbnQgaW4gdGhlIFF1YWRUcmVlXHJcbiAgICAgKiBAcGFyYW0geyhQb2ludHxPYmplY3QpfSBwb2ludCAtIEEgcG9pbnQgdG8gcmVtb3ZlXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcG9pbnQueCAtIFggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwb2ludC55IC0gWSBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX3JlbW92ZShwb2ludCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fY29udGFpbmVyLmNvbnRhaW5zKHBvaW50KSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX2lzRGl2aWRlZCkge1xyXG4gICAgICAgICAgICAvL3RoaXMuX3BvaW50cy5zcGxpY2UodGhpcy5fcG9pbnRzLmZpbmRJbmRleChhUG9pbnQgPT4gYVBvaW50LnggPT09IHBvaW50LnggJiYgYVBvaW50LnkgPT09IHBvaW50LnkpLCAxKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IHRoaXMuX3BvaW50cy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBsZW4gLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBvaW50LnggPT09IHRoaXMuX3BvaW50c1tpXS54ICYmIHBvaW50LnkgPT09IHRoaXMuX3BvaW50c1tpXS55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcG9pbnRzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fbmUuX3JlbW92ZShwb2ludCk7XHJcbiAgICAgICAgdGhpcy5fbncuX3JlbW92ZShwb2ludCk7XHJcbiAgICAgICAgdGhpcy5fc2UuX3JlbW92ZShwb2ludCk7XHJcbiAgICAgICAgdGhpcy5fc3cuX3JlbW92ZShwb2ludCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9jb25maWcucmVtb3ZlRW1wdHlOb2Rlcykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fbmUuX2dldE5vZGVQb2ludEFtb3VudCgpID09PSAwICYmICF0aGlzLl9uZS5faXNEaXZpZGVkICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9udy5fZ2V0Tm9kZVBvaW50QW1vdW50KCkgPT09IDAgJiYgIXRoaXMuX253Ll9pc0RpdmlkZWQgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NlLl9nZXROb2RlUG9pbnRBbW91bnQoKSA9PT0gMCAmJiAhdGhpcy5fc2UuX2lzRGl2aWRlZCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3cuX2dldE5vZGVQb2ludEFtb3VudCgpID09PSAwICYmICF0aGlzLl9zdy5faXNEaXZpZGVkKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5faXNEaXZpZGVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX25lO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX253O1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3NlO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3N3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5zZXJ0IGEgcG9pbnQgaW4gdGhlIFF1YWRUcmVlXHJcbiAgICAgKiBAcGFyYW0geyhQb2ludHxPYmplY3R8UG9pbnRbXXxPYmplY3RbXSl9IHBvaW50T3JBcnJheSAtIEEgcG9pbnQgb3IgYW4gYXJyYXkgb2YgcG9pbnRzIHRvIGluc2VydFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBvaW50T3JBcnJheS54IC0gWCBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBvaW50T3JBcnJheS55IC0gWSBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxyXG4gICAgICovXHJcbiAgICBpbnNlcnQocG9pbnRPckFycmF5KSB7XHJcbiAgICAgICAgaWYgKHBvaW50T3JBcnJheS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBwb2ludCBvZiBwb2ludE9yQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2luc2VydChwb2ludCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9pbnNlcnQocG9pbnRPckFycmF5KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5zZXJ0IGEgcG9pbnQgaW4gdGhlIFF1YWRUcmVlXHJcbiAgICAgKiBAcGFyYW0geyhQb2ludHxPYmplY3QpfSBwb2ludCAtIEEgcG9pbnQgdG8gaW5zZXJ0XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcG9pbnQueCAtIFggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwb2ludC55IC0gWSBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfaW5zZXJ0KHBvaW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9jb250YWluZXIuY29udGFpbnMocG9pbnQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5faXNEaXZpZGVkKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9nZXROb2RlUG9pbnRBbW91bnQoKSA8IHRoaXMuX2NvbmZpZy5jYXBhY2l0eSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcG9pbnRzLnB1c2gocG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2RpdmlkZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX25lLl9pbnNlcnQocG9pbnQpKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5fbncuX2luc2VydChwb2ludCkpIHJldHVybiB0cnVlO1xyXG4gICAgICAgIGlmICh0aGlzLl9zZS5faW5zZXJ0KHBvaW50KSkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgaWYgKHRoaXMuX3N3Ll9pbnNlcnQocG9pbnQpKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUXVlcnkgYWxsIHRoZSBwb2ludCB3aXRoaW4gYSByYW5nZVxyXG4gICAgICogQHBhcmFtIHsoQm94fE9iamVjdHxDaXJjbGUpfSByYW5nZSAtIFRoZSByYW5nZSB0byB0ZXN0XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcmFuZ2UueCAtIFggY29vcmRpbmF0ZSBvZiB0aGUgcmFuZ2UuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcmFuZ2UueSAtIFkgY29vcmRpbmF0ZSBvZiB0aGUgcmFuZ2UuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcmFuZ2UudyAtIFdpZHRoIG9mIHRoZSByYW5nZS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSByYW5nZS5oIC0gSGVpZ2h0IG9mIHRoZSByYW5nZS5cclxuICAgICAqIEByZXR1cm5zIHsoUG9pbnRbXXxPYmplY3RbXSl9IC0gVGhlIHBvaW50cyB3aXRoaW4gdGhlIHJhbmdlXHJcbiAgICAgKi9cclxuICAgIHF1ZXJ5KHJhbmdlKSB7XHJcbiAgICAgICAgbGV0IHBvaW50c0ZvdW5kID0gW107XHJcbiAgICAgICAgdGhpcy5fcXVlcnkocmFuZ2UsIHBvaW50c0ZvdW5kKTtcclxuICAgICAgICByZXR1cm4gcG9pbnRzRm91bmQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0geyhCb3h8T2JqZWN0KX0gcmFuZ2VcclxuICAgICAqIEBwYXJhbSB7KFBvaW50W118T2JqZWN0W10pfSBwb2ludHNGb3VuZFxyXG4gICAgICogQHJldHVybnMgeyhQb2ludFtdfE9iamVjdFtdKX1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9xdWVyeShyYW5nZSwgcG9pbnRzRm91bmQpIHtcclxuICAgICAgICBpZiAoIXJhbmdlLmludGVyc2VjdHModGhpcy5fY29udGFpbmVyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcG9pbnRzRm91bmQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5faXNEaXZpZGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX25lLl9xdWVyeShyYW5nZSwgcG9pbnRzRm91bmQpO1xyXG4gICAgICAgICAgICB0aGlzLl9udy5fcXVlcnkocmFuZ2UsIHBvaW50c0ZvdW5kKTtcclxuICAgICAgICAgICAgdGhpcy5fc2UuX3F1ZXJ5KHJhbmdlLCBwb2ludHNGb3VuZCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3N3Ll9xdWVyeShyYW5nZSwgcG9pbnRzRm91bmQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHAgPSB0aGlzLl9wb2ludHMuZmlsdGVyKChwb2ludCkgPT4gcmFuZ2UuY29udGFpbnMocG9pbnQpKTtcclxuXHJcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHBvaW50c0ZvdW5kLCBwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwb2ludHNGb3VuZDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENsZWFyIHRoZSBRdWFkVHJlZVxyXG4gICAgICovXHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9wb2ludHMgPSBbXTtcclxuXHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX25lO1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzLl9udztcclxuICAgICAgICBkZWxldGUgdGhpcy5fc2U7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX3N3O1xyXG4gICAgfVxyXG59XG5cbmV4cG9ydCB7Qm94LCBDaXJjbGUsIFBvaW50LCBRdWFkVHJlZX07XG5cbiJdLCJmaWxlIjoiaW5kZXguanMifQ==
